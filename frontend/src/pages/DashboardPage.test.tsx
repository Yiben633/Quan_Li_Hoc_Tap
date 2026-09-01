import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DashboardSummary } from '../features/dashboard/dashboard.api'
import type { StudyPlan, Task } from '../features/tasks/tasks.api'
import type { AuthUser } from '../types/auth'
import { useAuthStore } from '../stores/authStore'

const dashboardState = vi.hoisted(() => ({
  summary: null as DashboardSummary | null,
  todayTasks: [] as Task[],
  overdueTasks: [] as Task[],
  plan: null as StudyPlan | null,
  planTasks: [] as Task[],
  updateTaskStatus: vi.fn(),
}))

vi.mock('../config/features', () => ({ aiFeaturesEnabled: false }))
vi.mock('../hooks/useMediaQuery', () => ({ useMediaQuery: () => false }))
vi.mock('../features/dashboard/dashboard.hooks', () => ({
  useDashboardSummaryQuery: () => ({ data: dashboardState.summary, isLoading: false, isError: false, refetch: vi.fn() }),
  useProgressChartQuery: () => ({ data: { range: 'week', points: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('../features/study-sessions/studySessions.hooks', () => ({
  useStudyTimeStatisticsQuery: () => ({ data: { totalMinutes: 0 }, isLoading: false, isError: false }),
}))
vi.mock('../features/tasks/tasks.hooks', () => ({
  useOverdueTasksQuery: () => ({ data: dashboardState.overdueTasks, isLoading: false, isError: false, refetch: vi.fn() }),
  usePlansQuery: () => ({ data: { items: dashboardState.plan ? [dashboardState.plan] : [] }, isLoading: false, isError: false, refetch: vi.fn() }),
  useTasksQuery: () => ({ data: { items: dashboardState.planTasks }, isLoading: false, isError: false, refetch: vi.fn() }),
  useTaskStatusMutation: () => ({ mutate: dashboardState.updateTaskStatus }),
  useTodayTasksQuery: () => ({ data: dashboardState.todayTasks, isLoading: false, isError: false, refetch: vi.fn() }),
}))
vi.mock('../features/dashboard/DashboardPomodoroCard', () => ({ DashboardPomodoroCard: () => <section data-testid="pomodoro-slot" /> }))
vi.mock('../features/dashboard/DashboardWeeklyCalendar', () => ({ DashboardWeeklyCalendar: () => <section data-testid="weekly-calendar-slot" /> }))
vi.mock('../features/dashboard/DashboardNextTasksPanel', () => ({ DashboardNextTasksPanel: () => <section data-testid="next-tasks-slot" /> }))

import { DashboardPage } from './DashboardPage'

const student: AuthUser = {
  id: 'student-id',
  fullName: 'Dashboard Student',
  email: 'student@example.com',
  roles: ['student'],
}

function createSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    tasksToday: [],
    taskDone: 0,
    taskOverdue: 0,
    studyMinutesThisWeek: 0,
    studyHoursThisWeek: 0,
    activeSubjects: [],
    upcomingSchedules: [],
    activeGoals: [],
    ...overrides,
  }
}

function createTask(index: number, overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${index}`,
    title: `Task ${index}`,
    status: 'todo',
    priority: 'medium',
    dueDate: `2030-01-${String(index).padStart(2, '0')}T09:00:00.000Z`,
    estimatedMinutes: 30,
    sortOrder: index,
    ...overrides,
  }
}

function createPlan(): StudyPlan {
  return {
    id: 'plan-1',
    title: 'Active plan',
    status: 'in_progress',
    priority: 'high',
    progressPercent: 60,
    endDate: '2030-01-20T00:00:00.000Z',
    subject: { id: 'subject-1', code: 'WEB', name: 'Web development', colorHex: '#456b52' },
    taskTotal: 3,
    taskDone: 1,
  }
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>)
}

describe('DashboardPage data states', () => {
  beforeEach(() => {
    dashboardState.summary = createSummary()
    dashboardState.todayTasks = []
    dashboardState.overdueTasks = []
    dashboardState.plan = null
    dashboardState.planTasks = []
    dashboardState.updateTaskStatus.mockReset()
    useAuthStore.setState({ accessToken: 'dashboard-token', csrfToken: null, user: student, roles: student.roles, isAuthenticated: true })
  })

  it('renders the no tasks empty state without inventing work', () => {
    renderDashboard()

    expect(screen.getByText('Hôm nay chưa có việc')).toBeInTheDocument()
    expect(screen.getByText('Bắt đầu xây dựng nhịp của bạn')).toBeInTheDocument()
  })

  it('limits a large today task result to five compact tasks', () => {
    dashboardState.summary = createSummary({ tasksToday: [{ id: 'summary-task', title: 'Summary task', status: 'todo' }] })
    dashboardState.todayTasks = Array.from({ length: 6 }, (_, index) => createTask(index + 1))
    renderDashboard()

    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 5')).toBeInTheDocument()
    expect(screen.queryByText('Task 6')).not.toBeInTheDocument()
  })

  it('renders the no plans state when there is no active plan', () => {
    dashboardState.summary = createSummary({ tasksToday: [{ id: 'summary-task', title: 'Summary task', status: 'todo' }] })
    renderDashboard()

    expect(screen.getByText('Chưa có kế hoạch đang thực hiện')).toBeInTheDocument()
  })

  it('renders the active plan and its backend task checklist', () => {
    dashboardState.plan = createPlan()
    dashboardState.planTasks = [createTask(1, { title: 'Plan checklist task', studyPlanId: 'plan-1' })]
    renderDashboard()

    expect(screen.getByText('Active plan')).toBeInTheDocument()
    expect(screen.getByText('Plan checklist task')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('renders the no subjects state when the summary has no active subjects', () => {
    dashboardState.summary = createSummary({ tasksToday: [{ id: 'summary-task', title: 'Summary task', status: 'todo' }] })
    renderDashboard()

    expect(screen.getByText('Chưa có môn học đang theo dõi')).toBeInTheDocument()
  })

  it('limits a large subject result to four entries with real progress', () => {
    dashboardState.summary = createSummary({
      activeSubjects: Array.from({ length: 5 }, (_, index) => ({
        id: `subject-${index + 1}`,
        name: `Subject ${index + 1}`,
        code: `S${index + 1}`,
        colorHex: '#456b52',
        taskProgress: { taskTotal: 10, taskDone: index + 1, progressPercent: (index + 1) * 10 },
      })),
    })
    renderDashboard()

    expect(screen.getByText('Subject 1')).toBeInTheDocument()
    expect(screen.getByText('Subject 4')).toBeInTheDocument()
    expect(screen.queryByText('Subject 5')).not.toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('uses the AI unavailable fallback instead of a fabricated briefing', () => {
    dashboardState.summary = createSummary({ dailyBriefing: undefined })
    renderDashboard()

    expect(screen.getByText('AI Coach chưa khả dụng trong môi trường này.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lập kế hoạch cùng AI' })).toHaveAttribute('href', '/ai-coach')
    expect(screen.queryByText(/AI gợi ý/i)).not.toBeInTheDocument()
  })
})
