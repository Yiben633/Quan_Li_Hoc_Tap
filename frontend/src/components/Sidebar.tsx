import { NavLink } from 'react-router-dom'
import { BarChart3, BookOpen, BookOpenCheck, BrainCircuit, CalendarDays, CheckSquare, FileText, LayoutDashboard, ListTodo, NotebookPen, Settings, ShieldCheck, Target, Timer, Users, X } from 'lucide-react'
import { Logo } from './Logo'
import { useAuthStore } from '../stores/authStore'
import { aiFeaturesEnabled } from '../config/features'
import { useGroupInvitationsQuery } from '../features/groups/groups.hooks'

const primaryLinks = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/study-plans', label: 'Kế hoạch', icon: ListTodo },
  { to: '/tasks', label: 'Công việc', icon: CheckSquare },
  { to: '/calendar', label: 'Lịch', icon: CalendarDays },
  { to: '/subjects', label: 'Không gian học', icon: BookOpen },
  { to: '/goals', label: 'Mục tiêu', icon: Target },
  { to: '/documents', label: 'Tài liệu', icon: FileText },
  { to: '/notes', label: 'Ghi chú', icon: NotebookPen },
  { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: BookOpenCheck },
  { to: '/groups', label: 'Nhóm chia sẻ', icon: Users },
  ...(aiFeaturesEnabled ? [{ to: '/assistant', label: 'Trợ lý AI', icon: BrainCircuit }] : []),
  { to: '/study', label: 'Tập trung', icon: Timer },
  { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const roles = useAuthStore((state) => state.roles)
  const isAdmin = roles.includes('admin')
  const invitations = useGroupInvitationsQuery()
  const invitationCount = invitations.data?.length ?? 0
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="sidebar-head"><Logo /><button className="icon-button mobile-only" onClick={onClose} aria-label="Đóng menu"><X size={18} /></button></div>
    <nav className="nav-list" aria-label="Điều hướng chính">
      {primaryLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Icon size={18} /><span>{label}</span>{to === '/groups' && invitationCount > 0 && <span className="nav-invitation-count" aria-label={`${invitationCount} lời mời đang chờ`}>{invitationCount > 99 ? '99+' : invitationCount}</span>}</NavLink>)}
      <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Settings size={18} /><span>Cài đặt</span></NavLink>
    </nav>
    <div className="sidebar-footer"><div className="study-tip"><span className="tip-dot" /><div><strong>Giữ nhịp học tập</strong><p>Hoàn thành một việc nhỏ hôm nay.</p></div></div>{isAdmin && <NavLink to="/admin" className="nav-link muted" onClick={onClose}><ShieldCheck size={18} /><span>Quản trị</span></NavLink>}</div>
  </aside>
}
