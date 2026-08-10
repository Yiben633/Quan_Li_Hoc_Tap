import { z } from 'zod';
import { aiProvider } from '../ai.provider.js';
import type { AIProvider } from '../ai.provider.js';
import { buildCoachIntentPrompt } from './coachPrompt.js';
import type { CoachIntent, ParsedCoachIntent, StudyCoachContext } from './coach.types.js';

const MINIMUM_ACTION_CONFIDENCE = 0.55;

const coachIntentSchema = z.object({
  intent: z.enum(['question', 'create_study_plan', 'create_schedule', 'reschedule', 'prioritize_tasks', 'create_tasks', 'start_focus', 'clarify']),
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
  provider: Pick<AIProvider, 'coach'> = aiProvider,
): Promise<ParsedCoachIntent> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await provider.coach(buildCoachIntentPrompt(prompt, context, attempt === 1));
      const parsed = validateCoachIntent(output, context);
      if (parsed) return parsed;
    } catch {
      // Provider failures cannot authorize a planning action; use a safe clarify response.
    }
  }

  return clarify(['Hay dien dat lai muc tieu, mon hoc hoac khoang thoi gian ban muon sap xep.']);
}
