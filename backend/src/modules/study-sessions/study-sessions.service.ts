import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { serviceError } from '../../utils/service-error.js';

type Context = { ipAddress?: string; userAgent?: string };
type SessionState = { sessionId: string; userId: string; subjectId: string | null; status: 'running' | 'paused'; lastStartedAt: string | null; accumulatedMs: number };
type PomodoroState = { pomodoroId: string; sessionId: string; startedAt: string };
const SESSION_TTL = 7 * 24 * 60 * 60;
const sessionKey = (userId: string) => `study:active:${userId}`;
const pomodoroKey = (sessionId: string) => `study:pomodoro:active:${sessionId}`;
const pomodoroIdKey = (id: string) => `study:pomodoro:${id}`;
function now() { return new Date(); }
function elapsed(from: string | null, at = now()) { return from ? Math.max(0, at.getTime() - new Date(from).getTime()) : 0; }
async function redisReady() { if (redis.status === 'end' || redis.status === 'wait') await redis.connect(); }
async function read<T>(key: string) { await redisReady(); const value = await redis.get(key); return value ? JSON.parse(value) as T : null; }
async function write(key: string, value: unknown) { await redisReady(); await redis.set(key, JSON.stringify(value), 'EX', SESSION_TTL); }
async function remove(key: string) { await redisReady(); await redis.del(key); }
async function subject(userId: string, subjectId?: string | null) {
  if (!subjectId) return;
  const item = await prisma.subject.findFirst({ where: { id: subjectId, userId, deletedAt: null, semester: { deletedAt: null } } });
  if (!item) throw serviceError('Subject not found', 404);
}
async function ownedSession(userId: string, id: string) {
  const item = await prisma.studySession.findFirst({ where: { id, userId } });
  if (!item) throw serviceError('Study session not found', 404);
  return item;
}
async function activeState(userId: string, id: string) {
  const state = await read<SessionState>(sessionKey(userId));
  if (!state || state.sessionId !== id) throw serviceError('Study session is not active', 409);
  return state;
}
async function log(userId: string, action: string, entityId: string, context?: Context) {
  await prisma.activityLog.create({ data: { userId, action, entityType: 'study_session', entityId, ipAddress: context?.ipAddress, userAgent: context?.userAgent } });
}
function publicState(state: SessionState, at = now()) {
  const activeMs = state.accumulatedMs + (state.status === 'running' ? elapsed(state.lastStartedAt, at) : 0);
  return { ...state, elapsedSeconds: Math.floor(activeMs / 1000), totalMinutes: Math.floor(activeMs / 60000) };
}

export async function start(userId: string, input: { subjectId?: string | null; note?: string | null }, context?: Context) {
  await subject(userId, input.subjectId);
  const existing = await read<SessionState>(sessionKey(userId));
  if (existing) throw serviceError('You already have an active study session', 409);
  const databaseActive = await prisma.studySession.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: 'desc' } });
  if (databaseActive) throw serviceError('You already have an active study session', 409);
  const startedAt = now();
  const item = await prisma.studySession.create({ data: { userId, subjectId: input.subjectId ?? null, note: input.note ?? null, startedAt } });
  const state: SessionState = { sessionId: item.id, userId, subjectId: item.subjectId, status: 'running', lastStartedAt: startedAt.toISOString(), accumulatedMs: 0 };
  try { await redisReady(); const acquired = await redis.set(sessionKey(userId), JSON.stringify(state), 'EX', SESSION_TTL, 'NX'); if (!acquired) { await prisma.studySession.delete({ where: { id: item.id } }); throw serviceError('You already have an active study session', 409); } } catch (error) { if ((error as { statusCode?: number }).statusCode) throw error; await prisma.studySession.delete({ where: { id: item.id } }); throw error; }
  await log(userId, 'study_session.started', item.id, context);
  return { session: item, state: publicState(state) };
}

export async function active(userId: string) {
  let state = await read<SessionState>(sessionKey(userId));
  let session = state ? await prisma.studySession.findFirst({ where: { id: state.sessionId, userId, endedAt: null } }) : null;
  if (!state) {
    session = await prisma.studySession.findFirst({ where: { userId, endedAt: null }, orderBy: { startedAt: 'desc' } });
    if (!session) return null;
    state = { sessionId: session.id, userId, subjectId: session.subjectId, status: 'running', lastStartedAt: session.startedAt.toISOString(), accumulatedMs: 0 };
    await write(sessionKey(userId), state);
  }
  if (!session) {
    await remove(sessionKey(userId));
    return null;
  }
  const storedPomodoro = await read<PomodoroState>(pomodoroKey(session.id));
  const pomodoro = storedPomodoro
    ? await prisma.pomodoroSession.findFirst({ where: { id: storedPomodoro.pomodoroId, studySessionId: session.id, endedAt: null } })
    : null;
  if (storedPomodoro && !pomodoro) {
    await remove(pomodoroKey(session.id));
    await remove(pomodoroIdKey(storedPomodoro.pomodoroId));
  }
  const [completedFocusCount, lastCompletedPomodoro] = await Promise.all([
    prisma.pomodoroSession.count({ where: { studySessionId: session.id, sessionType: 'focus', isCompleted: true } }),
    prisma.pomodoroSession.findFirst({ where: { studySessionId: session.id, isCompleted: true }, orderBy: { endedAt: 'desc' }, select: { sessionType: true } }),
  ]);
  return {
    session,
    state: publicState(state),
    pomodoro: pomodoro && storedPomodoro ? { ...pomodoro, state: { ...storedPomodoro, elapsedSeconds: Math.floor(elapsed(storedPomodoro.startedAt) / 1000) } } : null,
    completedFocusCount,
    lastCompletedPomodoroType: lastCompletedPomodoro?.sessionType ?? null,
  };
}

export async function pause(userId: string, id: string, context?: Context) {
  await ownedSession(userId, id);
  const state = await activeState(userId, id);
  if (state.status === 'paused') throw serviceError('Study session is already paused', 409);
  const at = now(); const next: SessionState = { ...state, status: 'paused', lastStartedAt: null, accumulatedMs: state.accumulatedMs + elapsed(state.lastStartedAt, at) };
  await write(sessionKey(userId), next); await log(userId, 'study_session.paused', id, context);
  return publicState(next, at);
}

export async function resume(userId: string, id: string, context?: Context) {
  await ownedSession(userId, id);
  const state = await activeState(userId, id);
  if (state.status === 'running') throw serviceError('Study session is already running', 409);
  const next: SessionState = { ...state, status: 'running', lastStartedAt: now().toISOString() };
  await write(sessionKey(userId), next); await log(userId, 'study_session.resumed', id, context);
  return publicState(next);
}

export async function end(userId: string, id: string, context?: Context) {
  const item = await ownedSession(userId, id); const state = await activeState(userId, id); const endedAt = now();
  const totalMinutes = Math.floor((state.accumulatedMs + (state.status === 'running' ? elapsed(state.lastStartedAt, endedAt) : 0)) / 60000);
  const updated = await prisma.$transaction(async (tx) => tx.studySession.update({ where: { id: item.id }, data: { endedAt, totalMinutes } }));
  await remove(sessionKey(userId)); await remove(pomodoroKey(id)); await log(userId, 'study_session.ended', id, context);
  return { ...updated, state: { status: 'ended', totalMinutes } };
}

export async function startPomodoro(userId: string, sessionId: string, input: { sessionType: 'focus' | 'short_break' | 'long_break'; plannedMinutes: number }, context?: Context) {
  await ownedSession(userId, sessionId); await activeState(userId, sessionId);
  const existing = await read<PomodoroState>(pomodoroKey(sessionId));
  if (existing) throw serviceError('A pomodoro is already active for this study session', 409);
  const startedAt = now();
  const item = await prisma.pomodoroSession.create({ data: { studySessionId: sessionId, sessionType: input.sessionType, plannedMinutes: input.plannedMinutes, startedAt } });
  const state: PomodoroState = { pomodoroId: item.id, sessionId, startedAt: startedAt.toISOString() };
  try { await redisReady(); const acquired = await redis.set(pomodoroKey(sessionId), JSON.stringify(state), 'EX', SESSION_TTL, 'NX'); if (!acquired) { await prisma.pomodoroSession.delete({ where: { id: item.id } }); throw serviceError('A pomodoro is already active for this study session', 409); } await redis.set(pomodoroIdKey(item.id), JSON.stringify(state), 'EX', SESSION_TTL); } catch (error) { if ((error as { statusCode?: number }).statusCode) throw error; await prisma.pomodoroSession.delete({ where: { id: item.id } }); throw error; }
  await log(userId, 'pomodoro.started', item.id, context);
  return { ...item, state: { ...state, elapsedSeconds: 0 } };
}

export async function endPomodoro(userId: string, sessionId: string, pomodoroId: string, context?: Context) {
  await ownedSession(userId, sessionId); const state = await activeState(userId, sessionId); if (state.sessionId !== sessionId) throw serviceError('Study session is not active', 409);
  const pomodoro = await prisma.pomodoroSession.findFirst({ where: { id: pomodoroId, studySessionId: sessionId, endedAt: null } });
  if (!pomodoro) throw serviceError('Pomodoro session not found or already ended', 404);
  const stored = await read<PomodoroState>(pomodoroIdKey(pomodoroId));
  if (!stored) throw serviceError('Pomodoro state expired; cannot safely end session', 409);
  const endedAt = now(); const actualMinutes = Math.floor(elapsed(stored.startedAt, endedAt) / 60000);
  const updated = await prisma.pomodoroSession.update({ where: { id: pomodoroId }, data: { endedAt, actualMinutes, isCompleted: true } });
  await remove(pomodoroKey(sessionId)); await remove(pomodoroIdKey(pomodoroId)); await log(userId, 'pomodoro.ended', pomodoroId, context);
  return updated;
}

function startOfDay(date = new Date()) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function addDays(date: Date, days: number) { const value = new Date(date); value.setUTCDate(value.getUTCDate() + days); return value; }
export async function statistics(userId: string, query: { range: 'day' | 'week' | 'month'; subjectId?: string }) {
  if (query.subjectId) await subject(userId, query.subjectId);
  const today = startOfDay(); const start = query.range === 'day' ? today : query.range === 'week' ? addDays(today, -((today.getUTCDay() + 6) % 7)) : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const end = query.range === 'month' ? new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)) : query.range === 'week' ? addDays(start, 7) : addDays(start, 1);
  const sessions = await prisma.studySession.findMany({ where: { userId, startedAt: { gte: start, lt: end }, ...(query.subjectId ? { subjectId: query.subjectId } : {}) }, orderBy: { startedAt: 'asc' }, select: { id: true, subjectId: true, startedAt: true, endedAt: true, totalMinutes: true } });
  const totalMinutes = sessions.reduce((sum, item) => sum + item.totalMinutes, 0);
  return { range: query.range, subjectId: query.subjectId ?? null, start, end, totalMinutes, totalHours: Math.round(totalMinutes / 60 * 100) / 100, sessionCount: sessions.length, sessions };
}
