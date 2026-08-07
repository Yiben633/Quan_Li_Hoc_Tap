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
import { LearningSpacesPage } from '../pages/LearningSpacesPage'
import { TopicsPage } from '../pages/TopicsPage'
import { TopicDetailPage } from '../pages/TopicDetailPage'
import { TasksPage } from '../pages/TasksPage'
import { StudyPlansPage } from '../pages/StudyPlansPage'
import { StudyPlanDetailPage } from '../pages/StudyPlanDetailPage'
import { KanbanPage } from '../pages/KanbanPage'
import { CalendarPage } from '../pages/CalendarPage'

export const router = createBrowserRouter([
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/register', element: <AuthLayout><RegisterPage /></AuthLayout> },
  { path: '/forgot-password', element: <AuthLayout><ForgotPasswordPage /></AuthLayout> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [
    { index: true, element: <DashboardPage /> },
    { path: 'tasks', element: <TasksPage /> },
    { path: 'tasks/kanban', element: <KanbanPage /> },
    { path: 'kanban', element: <Navigate to="/tasks/kanban" replace /> },
    { path: 'study-plans', element: <StudyPlansPage /> },
    { path: 'study-plans/:id', element: <StudyPlanDetailPage /> },
    { path: 'goals', element: <ModulePlaceholderPage title="Mục tiêu" description="Theo dõi những điều bạn muốn hoàn thành." /> },
    { path: 'calendar', element: <CalendarPage /> },
    { path: 'subjects', element: <LearningSpacesPage /> },
    { path: 'topics', element: <TopicsPage /> },
    { path: 'topics/:id', element: <TopicDetailPage /> },
    { path: 'study', element: <ModulePlaceholderPage title="Tập trung" description="Bắt đầu phiên học và theo dõi Pomodoro." /> },
    { path: 'settings', element: <SettingsPage /> },
    { element: <AdminRoute />, children: [{ path: 'admin', element: <ModulePlaceholderPage title="Quản trị" description="Khu vực quản lý dành cho admin." /> }] },
  ] }] },
  { path: '*', element: <Navigate to="/" replace /> },
])
