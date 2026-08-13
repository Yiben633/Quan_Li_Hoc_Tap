import type { CoachIntent, ParsedCoachIntent, StudyCoachContext } from './coach.types.js';

const PLANNING_INTENTS = new Set<CoachIntent>(['create_study_plan', 'create_schedule', 'reschedule', 'create_tasks']);

export const planningScopeClarification = 'Bạn muốn lập kế hoạch cho một môn cụ thể hay tất cả công việc tuần này?';

function relevantSubjectCount(context: StudyCoachContext) {
  return new Set(context.tasks.map((task) => task.subjectId).filter((subjectId): subjectId is string => subjectId !== null)).size;
}

export function requiresPlanningScopeClarification(intent: ParsedCoachIntent, context: StudyCoachContext) {
  if (!PLANNING_INTENTS.has(intent.intent)) return false;
  if (intent.subjectIds.length > 0 || intent.taskIds.length > 0) return false;
  return relevantSubjectCount(context) > 1;
}

export function resolveCoachClarification(intent: ParsedCoachIntent, context: StudyCoachContext): ParsedCoachIntent {
  if (!requiresPlanningScopeClarification(intent, context)) return intent;

  return {
    intent: 'clarify',
    confidence: 1,
    subjectIds: [],
    taskIds: [],
    missingInformation: [planningScopeClarification],
  };
}
