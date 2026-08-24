export type StudyCoachContext = {
  now: string;
  timezone: string;
  subjects: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    status: string;
    targetGrade: number | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    subjectId: string | null;
    studyPlanId: string | null;
    startDate: string | null;
    dueDate: string | null;
    priority: string;
    status: string;
    estimatedMinutes: number | null;
    difficulty: number | null;
  }>;
  plans: Array<{
    id: string;
    title: string;
    subjectId: string | null;
    startDate: string | null;
    endDate: string | null;
    priority: string;
    status: string;
    progressPercent: number;
    estimatedHours: number | null;
  }>;
  calendar: Array<{
    id: string;
    type: 'event' | 'schedule';
    title: string;
    subjectId: string | null;
    startAt: string;
    endAt: string | null;
    recurrenceRule?: string;
  }>;
  goals: Array<{
    id: string;
    name: string;
    type: string;
    subjectId: string | null;
    targetValue: number;
    currentValue: number;
    deadline: string | null;
  }>;
  stats: {
    studyMinutesThisWeek: number;
    completedTasksThisWeek: number;
  };
};

export type StudyCoachContextOptions = {
  horizonDays?: number;
  subjectId?: string;
  studyPlanId?: string;
  taskId?: string;
  eventId?: string;
};

export type CoachIntent =
  | 'question'
  | 'create_study_plan'
  | 'create_schedule'
  | 'reschedule'
  | 'prioritize_tasks'
  | 'create_tasks'
  | 'create_goal'
  | 'analytics'
  | 'start_focus'
  | 'clarify';

/**
 * Bounded, user-visible conversation state used as data for the provider.
 * It never contains provider reasoning or provider configuration.
 */
export type CoachConversationMemory = {
  summary: string | null;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'tool';
    content: string;
    createdAt: string;
  }>;
  metrics: {
    recentMessageCount: number;
    summarizedMessageCount: number;
  };
};

export type ParsedCoachIntent = {
  intent: CoachIntent;
  confidence: number;
  subjectIds: string[];
  taskIds: string[];
  dateRange?: {
    start?: string;
    end?: string;
  };
  constraints?: {
    maxMinutesPerDay?: number;
    sessionMinutes?: number;
    preferredStartTime?: string;
    preferredEndTime?: string;
    excludeDays?: number[];
  };
  goal?: {
    name: string;
    type: 'score' | 'study_time' | 'task_count' | 'course_completion' | 'gpa';
    targetValue: number;
    deadline?: string;
  };
  missingInformation: string[];
};

export type CoachContextReductionLimits = {
  subjects: number;
  tasks: number;
  plans: number;
  calendar: number;
  goals: number;
};

export type ReducedStudyCoachContext = StudyCoachContext & {
  metrics: {
    subjectCountOriginal: number;
    subjectCountIncluded: number;
    taskCountOriginal: number;
    taskCountIncluded: number;
    planCountOriginal: number;
    planCountIncluded: number;
    calendarCountOriginal: number;
    calendarCountIncluded: number;
    goalCountOriginal: number;
    goalCountIncluded: number;
  };
};
