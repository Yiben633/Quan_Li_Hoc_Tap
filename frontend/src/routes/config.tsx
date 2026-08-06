import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute, AdminRoute } from './guards'
import { AppLayout } from '../layouts/AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ModulePlaceholderPage } from '../pages/ModulePlaceholderPage'
import { AuthLayout } from '../layouts/AuthLayout'
import { SettingsPage } from '../pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/register', element: <AuthLayout><RegisterPage /></AuthLayout> },
  { path: '/forgot-password', element: <AuthLayout><ForgotPasswordPage /></AuthLayout> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [
    { index: true, element: <DashboardPage /> },
    { path: 'tasks', element: <ModulePlaceholderPage title="Công việc" description="Quản lý task, kanban và tiến độ học tập." /> },
    { path: 'calendar', element: <ModulePlaceholderPage title="Lịch học" description="Tập hợp lịch học, sự kiện, deadline và kỳ thi." /> },
    { path: 'subjects', element: <ModulePlaceholderPage title="Môn học" description="Theo dõi môn học, điểm số và kế hoạch học." /> },
    { path: 'study', element: <ModulePlaceholderPage title="Tập trung" description="Bắt đầu phiên học và theo dõi Pomodoro." /> },
    { path: 'settings', element: <SettingsPage /> },
    { element: <AdminRoute />, children: [{ path: 'admin', element: <ModulePlaceholderPage title="Quản trị" description="Khu vực quản lý dành cho admin." /> }] },
  ] }] },
  { path: '*', element: <Navigate to="/" replace /> },
])
