import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { login } from '../features/auth/auth.api'
import { useAuthStore } from '../stores/authStore'
import type { AuthUser } from '../types/auth'
import { LoginPage } from './LoginPage'

vi.mock('../features/auth/auth.api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/auth/auth.api')>()
  return { ...actual, login: vi.fn() }
})

const student: AuthUser = {
  id: 'student-id',
  fullName: 'Người học',
  email: 'student@example.com',
  roles: ['student'],
}
const admin: AuthUser = {
  ...student,
  id: 'admin-id',
  email: 'admin@example.com',
  roles: ['student', 'admin'],
}

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard cá nhân</div>} />
          <Route path="/admin" element={<div>Trang quản trị StudyFlow</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function submitLogin(email: string) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Mật khẩu'), 'password123')
  await user.click(screen.getByRole('button', { name: /^Đăng nhập/ }))
  return user
}

describe('LoginPage destination chooser', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({
      accessToken: null,
      csrfToken: null,
      user: null,
      roles: [],
      isAuthenticated: false,
    })
    vi.mocked(login).mockReset()
  })

  it('đưa người dùng thường đến dashboard ngay sau đăng nhập', async () => {
    vi.mocked(login).mockResolvedValue({
      user: student,
      accessToken: 'student-token',
      csrfToken: 'student-csrf',
    })

    renderLogin()
    await submitLogin(student.email)

    expect(await screen.findByText('Dashboard cá nhân')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('studyflow_access_token')).toBe('student-token')
  })

  it('cho admin chọn mở trang quản trị mà vẫn giữ session', async () => {
    vi.mocked(login).mockResolvedValue({
      user: admin,
      accessToken: 'admin-token',
      csrfToken: 'admin-csrf',
    })

    renderLogin()
    const user = await submitLogin(admin.email)

    expect(await screen.findByRole('dialog', { name: 'Chào mừng quay lại' })).toBeInTheDocument()
    expect(screen.getByText('Bạn muốn bắt đầu ở đâu?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mở Trang quản trị' }))

    expect(await screen.findByText('Trang quản trị StudyFlow')).toBeInTheDocument()
    expect(sessionStorage.getItem('studyflow_access_token')).toBe('admin-token')
    expect(useAuthStore.getState().roles).toContain('admin')
  })

  it('đóng modal admin bằng Escape và mặc định vào dashboard', async () => {
    vi.mocked(login).mockResolvedValue({
      user: admin,
      accessToken: 'admin-token',
      csrfToken: 'admin-csrf',
    })

    renderLogin()
    const user = await submitLogin(admin.email)

    expect(await screen.findByRole('dialog', { name: 'Chào mừng quay lại' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    expect(await screen.findByText('Dashboard cá nhân')).toBeInTheDocument()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})
