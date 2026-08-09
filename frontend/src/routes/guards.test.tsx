import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminRoute, ProtectedRoute } from './guards'
import { useAuthStore } from '../stores/authStore'
import type { AuthUser } from '../types/auth'

const member: AuthUser = { id: 'member', fullName: 'Người học', email: 'member@example.com', roles: ['student'] }
const admin: AuthUser = { ...member, id: 'admin', roles: ['admin'] }

function renderProtected() {
  return render(<MemoryRouter initialEntries={['/private']}><Routes>
    <Route element={<ProtectedRoute />}><Route path="/private" element={<div>Nội dung riêng tư</div>} /></Route>
    <Route path="/login" element={<div>Đăng nhập</div>} />
  </Routes></MemoryRouter>)
}

function renderAdmin() {
  return render(<MemoryRouter initialEntries={['/admin']}><Routes>
    <Route element={<AdminRoute />}><Route path="/admin" element={<div>Khu vực quản trị</div>} /></Route>
    <Route path="/" element={<div>Tổng quan</div>} />
  </Routes></MemoryRouter>)
}

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ accessToken: null, user: null, roles: [], isAuthenticated: false })
  })

  it('đưa khách chưa đăng nhập về trang đăng nhập', () => {
    renderProtected()
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument()
  })

  it('cho người đã đăng nhập mở route được bảo vệ', () => {
    useAuthStore.setState({ accessToken: 'token', user: member, roles: member.roles, isAuthenticated: true })
    renderProtected()
    expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument()
  })

  it('chỉ cho vai trò admin mở trang quản trị', () => {
    useAuthStore.setState({ accessToken: 'token', user: member, roles: member.roles, isAuthenticated: true })
    const view = renderAdmin()
    expect(screen.getByText('Tổng quan')).toBeInTheDocument()
    view.unmount()
    useAuthStore.setState({ accessToken: 'token', user: admin, roles: admin.roles, isAuthenticated: true })
    renderAdmin()
    expect(screen.getByText('Khu vực quản trị')).toBeInTheDocument()
  })
})
