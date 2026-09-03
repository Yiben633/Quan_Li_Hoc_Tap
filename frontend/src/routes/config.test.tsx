import { act, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '../types/auth'
import { useAuthStore } from '../stores/authStore'

vi.mock('../layouts/AppLayout', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { AppLayout: () => <Outlet /> }
})
vi.mock('../pages/DashboardPage', () => ({ DashboardPage: () => <main data-testid="dashboard-page">Dashboard</main> }))
vi.mock('../pages/TasksPage', () => ({ TasksPage: () => <main data-testid="tasks-page">Tasks</main> }))
vi.mock('../pages/StudyPlansPage', () => ({ StudyPlansPage: () => <main data-testid="study-plans-page">Study plans</main> }))
vi.mock('../pages/CalendarPage', () => ({ CalendarPage: () => <main data-testid="calendar-page">Calendar</main> }))
vi.mock('../pages/AdminPage', () => ({ AdminPage: () => <main data-testid="admin-page">Admin</main> }))
vi.mock('../pages/LoginPage', () => ({ LoginPage: () => <main data-testid="login-page">Login</main> }))
vi.mock('../pages/NotFoundPage', () => ({ NotFoundPage: () => <main data-testid="not-found-page">Not found</main> }))
vi.mock('../config/features', () => ({ aiFeaturesEnabled: false }))

import { routeDefinitions } from './config'

const student: AuthUser = {
  id: 'student-id',
  fullName: 'Student',
  email: 'student@example.com',
  roles: ['student'],
}

const admin: AuthUser = {
  ...student,
  id: 'admin-id',
  roles: ['student', 'admin'],
}

function setAuthenticatedUser(user: AuthUser) {
  useAuthStore.setState({
    accessToken: 'route-test-token',
    csrfToken: null,
    user,
    roles: user.roles,
    isAuthenticated: true,
  })
}

async function renderRoute(path: string, user: AuthUser = student) {
  setAuthenticatedUser(user)
  const router = createMemoryRouter(routeDefinitions, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'))
  return router
}

describe('application routes', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ accessToken: null, csrfToken: null, user: null, roles: [], isAuthenticated: false })
  })

  it.each([
    ['/dashboard', 'dashboard-page'],
    ['/tasks', 'tasks-page'],
    ['/study-plans', 'study-plans-page'],
    ['/calendar', 'calendar-page'],
  ])('opens %s from a direct URL without a route error', async (path, pageTestId) => {
    const router = await renderRoute(path)

    expect(await screen.findByTestId(pageTestId)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(path)
    expect(router.state.errors ?? null).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps /ai-coach registered and renders the safe unavailable page when AI is disabled', async () => {
    const router = await renderRoute('/ai-coach')

    expect(await screen.findByRole('status')).toHaveTextContent('AI Coach chưa khả dụng trong môi trường này.')
    expect(screen.getByRole('link', { name: 'Công việc' })).toHaveAttribute('href', '/tasks')
    expect(screen.getByRole('link', { name: 'Kế hoạch' })).toHaveAttribute('href', '/study-plans')
    expect(router.state.location.pathname).toBe('/ai-coach')
    expect(router.state.errors ?? null).toBeNull()
    expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument()
  })

  it('keeps /assistant redirect registered when AI is disabled', async () => {
    const router = await renderRoute('/assistant')

    expect(await screen.findByRole('status')).toHaveTextContent('AI Coach chưa khả dụng trong môi trường này.')
    expect(router.state.location.pathname).toBe('/ai-coach')
    expect(router.state.errors ?? null).toBeNull()
    expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument()
  })

  it('keeps /admin behind the admin role guard on a direct URL', async () => {
    const studentRouter = await renderRoute('/admin')
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument()
    expect(studentRouter.state.location.pathname).toBe('/')
    expect(studentRouter.state.errors ?? null).toBeNull()

    const adminRouter = await renderRoute('/admin', admin)
    expect(await screen.findByTestId('admin-page')).toBeInTheDocument()
    expect(adminRouter.state.location.pathname).toBe('/admin')
    expect(adminRouter.state.errors ?? null).toBeNull()
  })

  it.each([
    '/admin',
    '/admin?tab=overview',
    '/admin?tab=users',
    '/admin?tab=templates',
    '/admin?tab=feedback',
    '/admin?tab=logs',
    '/admin?tab=content',
  ])('opens %s directly without a route error', async (path) => {
    const router = await renderRoute(path, admin)

    expect(await screen.findByTestId('admin-page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin')
    expect(router.state.location.search).toBe(new URL(path, 'http://studyflow.local').search)
    expect(router.state.errors ?? null).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('handles unsupported /admin/* URLs with the safe not-found route', async () => {
    const router = await renderRoute('/admin/unknown', admin)

    expect(await screen.findByTestId('not-found-page')).toBeInTheDocument()
    expect(router.state.errors ?? null).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('preserves safe admin URLs through back and forward navigation', async () => {
    const router = await renderRoute('/admin?tab=overview', admin)
    expect(await screen.findByTestId('admin-page')).toBeInTheDocument()

    await act(async () => { await router.navigate('/admin?tab=users') })
    expect(router.state.location.search).toBe('?tab=users')

    await act(async () => { await router.navigate(-1) })
    expect(router.state.location.search).toBe('?tab=overview')

    await act(async () => { await router.navigate(1) })
    expect(router.state.location.search).toBe('?tab=users')
    expect(await screen.findByTestId('admin-page')).toBeInTheDocument()
    expect(router.state.errors ?? null).toBeNull()
  })

  it('supports back and forward navigation between protected routes', async () => {
    const router = await renderRoute('/dashboard')
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument()

    await act(async () => { await router.navigate('/tasks') })
    expect(await screen.findByTestId('tasks-page')).toBeInTheDocument()

    await act(async () => { await router.navigate(-1) })
    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument()

    await act(async () => { await router.navigate(1) })
    expect(await screen.findByTestId('tasks-page')).toBeInTheDocument()
    expect(router.state.errors ?? null).toBeNull()
  })
})
