import type { CoachContextReductionLimits, ReducedStudyCoachContext, StudyCoachContext } from './coach.types.js';

export const defaultCoachContextReductionLimits: CoachContextReductionLimits = {
  subjects: 16,
  tasks: 40,
  plans: 20,
  calendar: 40,
  goals: 12,
};

function boundedLimit(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value ?? fallback));
}

function timestamp(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function taskPriority(task: StudyCoachContext['tasks'][number], now: number) {
  const dueAt = timestamp(task.dueDate);
  if (dueAt < now) return 0;
  if (dueAt <= now + 3 * 24 * 60 * 60 * 1000) return 1;
  if (task.status === 'in_progress') return 2;
  if (task.priority === 'urgent' || task.priority === 'high') return 3;
  return 4;
}

function planPriority(plan: StudyCoachContext['plans'][number]) {
  if (plan.status === 'in_progress') return 0;
  if (plan.status === 'overdue') return 1;
  if (plan.status === 'not_started') return 2;
  return 3;
}

export function reduceCoachContext(
  context: StudyCoachContext,
  overrides: Partial<CoachContextReductionLimits> = {},
): ReducedStudyCoachContext {
  const limits: CoachContextReductionLimits = {
    subjects: boundedLimit(overrides.subjects, defaultCoachContextReductionLimits.subjects),
    tasks: boundedLimit(overrides.tasks, defaultCoachContextReductionLimits.tasks),
    plans: boundedLimit(overrides.plans, defaultCoachContextReductionLimits.plans),
    calendar: boundedLimit(overrides.calendar, defaultCoachContextReductionLimits.calendar),
    goals: boundedLimit(overrides.goals, defaultCoachContextReductionLimits.goals),
  };
  const now = timestamp(context.now);
  const tasks = [...context.tasks]
    .sort((left, right) => taskPriority(left, now) - taskPriority(right, now) || timestamp(left.dueDate) - timestamp(right.dueDate))
    .slice(0, limits.tasks);
  const plans = [...context.plans]
    .sort((left, right) => planPriority(left) - planPriority(right) || timestamp(left.endDate) - timestamp(right.endDate))
    .slice(0, limits.plans);
  const calendar = [...context.calendar]
    .sort((left, right) => timestamp(left.startAt) - timestamp(right.startAt))
    .slice(0, limits.calendar);
  const goals = [...context.goals]
    .sort((left, right) => timestamp(left.deadline) - timestamp(right.deadline))
    .slice(0, limits.goals);
  const subjects = context.subjects.slice(0, limits.subjects);

  return {
    ...context,
    subjects,
    tasks,
    plans,
    calendar,
    goals,
    metrics: {
      subjectCountOriginal: context.subjects.length,
      subjectCountIncluded: subjects.length,
      taskCountOriginal: context.tasks.length,
      taskCountIncluded: tasks.length,
      planCountOriginal: context.plans.length,
      planCountIncluded: plans.length,
      calendarCountOriginal: context.calendar.length,
      calendarCountIncluded: calendar.length,
      goalCountOriginal: context.goals.length,
      goalCountIncluded: goals.length,
    },
  };
}
