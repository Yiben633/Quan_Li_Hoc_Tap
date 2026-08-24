import { z } from 'zod';
import { aiProvider, AI_PROVIDER_UNAVAILABLE_MESSAGE } from '../ai.provider.js';
import type { AIProvider, AIProviderCallResult, AIProviderUsage } from '../ai.provider.js';
import { buildCoachIntentPrompt } from './coachPrompt.js';
import { assertAIInputLength } from '../aiCostControl.service.js';
import type { CoachConversationMemory, CoachIntent, ParsedCoachIntent, StudyCoachContext } from './coach.types.js';

const MINIMUM_ACTION_CONFIDENCE = 0.55;

export type CoachIntentProviderTelemetry = {
  usage?: AIProviderUsage;
  latencyMs: number;
};

const coachIntentSchema = z.object({
  intent: z.enum(['question', 'create_study_plan', 'create_schedule', 'reschedule', 'prioritize_tasks', 'create_tasks', 'create_goal', 'analytics', 'start_focus', 'clarify']),
  confidence: z.number().min(0).max(1),
  subjectIds: z.array(z.string().uuid()).max(20).optional(),
  taskIds: z.array(z.string().uuid()).max(100).optional(),
  dateRange: z.object({
    start: z.string().datetime({ offset: true }).optional(),
    end: z.string().datetime({ offset: true }).optional(),
  }).optional(),
  constraints: z.object({
    maxMinutesPerDay: z.number().int().min(15).max(24 * 60).optional(),
    sessionMinutes: z.number().int().min(5).max(8 * 60).optional(),
    preferredStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    preferredEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    excludeDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  }).optional(),
  goal: z.object({
    name: z.string().trim().min(1).max(200),
    type: z.enum(['score', 'study_time', 'task_count', 'course_completion', 'gpa']),
    targetValue: z.number().positive().max(1_000_000_000),
    deadline: z.string().date().optional(),
  }).strict().optional(),
  missingInformation: z.array(z.string().trim().min(1).max(300)).max(5).optional(),
}).strict();

type RawCoachIntent = z.infer<typeof coachIntentSchema>;

function clarify(missingInformation: string[]): ParsedCoachIntent {
  return {
    intent: 'clarify',
    confidence: 1,
    subjectIds: [],
    taskIds: [],
    missingInformation,
  };
}

function knownIds(context: StudyCoachContext) {
  return {
    subjects: new Set(context.subjects.map((subject) => subject.id)),
    tasks: new Set(context.tasks.map((task) => task.id)),
  };
}

function crossCheckIds(output: RawCoachIntent, context: StudyCoachContext): ParsedCoachIntent {
  const ids = knownIds(context);
  const subjectIds = output.subjectIds ?? [];
  const taskIds = output.taskIds ?? [];
  const unknownSubject = subjectIds.find((id) => !ids.subjects.has(id));
  const unknownTask = taskIds.find((id) => !ids.tasks.has(id));
  if (unknownSubject || unknownTask) {
    return clarify(['Khong the xac minh mon hoc hoac cong viec duoc de xuat. Hay chon lai du lieu hien co.']);
  }

  if (output.intent !== 'question' && output.intent !== 'clarify' && output.confidence < MINIMUM_ACTION_CONFIDENCE) {
    return clarify(['Yeu cau nay can them thong tin de lap ke hoach chinh xac.']);
  }

  return {
    intent: output.intent as CoachIntent,
    confidence: output.confidence,
    subjectIds,
    taskIds,
    ...(output.dateRange ? { dateRange: output.dateRange } : {}),
    ...(output.constraints ? { constraints: output.constraints } : {}),
    ...(output.goal ? { goal: output.goal } : {}),
    missingInformation: output.missingInformation ?? [],
  };
}

export function validateCoachIntent(output: unknown, context: StudyCoachContext): ParsedCoachIntent | null {
  const parsed = coachIntentSchema.safeParse(output);
  return parsed.success ? crossCheckIds(parsed.data, context) : null;
}

export async function parseCoachIntent(
  prompt: string,
  context: StudyCoachContext,
  provider: Pick<AIProvider, 'coach' | 'coachWithUsage'> = aiProvider,
  memory?: CoachConversationMemory,
  onProviderCall?: (telemetry: CoachIntentProviderTelemetry) => void,
): Promise<ParsedCoachIntent> {
  let providerFailed = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const providerPrompt = buildCoachIntentPrompt(prompt, context, attempt === 1, memory);
    assertAIInputLength(providerPrompt);
    try {
      const startedAt = performance.now();
      const rawOutput = await (provider.coachWithUsage?.(providerPrompt) ?? provider.coach(providerPrompt));
      const output = typeof rawOutput === 'object' && rawOutput !== null && 'value' in rawOutput
        ? (rawOutput as AIProviderCallResult<unknown>).value
        : rawOutput;
      const usage = typeof rawOutput === 'object' && rawOutput !== null && 'value' in rawOutput
        ? (rawOutput as AIProviderCallResult<unknown>).usage
        : undefined;
      onProviderCall?.({ usage, latencyMs: Math.round(performance.now() - startedAt) });
      const parsed = validateCoachIntent(output, context);
      if (parsed) return parsed;
    } catch {
      providerFailed = true;
      // Provider failures cannot authorize a planning action; use a safe clarify response.
    }
  }

  if (providerFailed) return clarify([AI_PROVIDER_UNAVAILABLE_MESSAGE]);

  return clarify(['Hay dien dat lai muc tieu, mon hoc hoac khoang thoi gian ban muon sap xep.']);
}
