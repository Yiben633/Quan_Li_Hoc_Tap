import { NavLink } from 'react-router-dom'
import { BarChart3, BookOpen, BookOpenCheck, BrainCircuit, CalendarDays, CheckSquare, FileText, LayoutDashboard, ListTodo, NotebookPen, Settings, ShieldCheck, Target, Timer, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Logo } from './Logo'
import { useAuthStore } from '../stores/authStore'
import { aiFeaturesEnabled } from '../config/features'
import { useGroupInvitationsQuery } from '../features/groups/groups.hooks'
import { natureAssets } from '../config/natureAssets'

type SidebarLink = { to: string; label: string; icon: LucideIcon; invitationCount?: boolean }

const navigationSections: Array<{ label: string; links: SidebarLink[] }> = [
  { label: 'TỔNG QUAN', links: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'HỌC TẬP',
    links: [
      { to: '/subjects', label: 'Môn học', icon: BookOpen },
      { to: '/study-plans', label: 'Kế hoạch', icon: ListTodo },
      { to: '/tasks', label: 'Công việc', icon: CheckSquare },
      { to: '/calendar', label: 'Lịch', icon: CalendarDays },
      { to: '/documents', label: 'Tài liệu', icon: FileText },
      { to: '/notes', label: 'Ghi chú', icon: NotebookPen },
      { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: BookOpenCheck },
      { to: '/groups', label: 'Nhóm chia sẻ', icon: Users, invitationCount: true },
    ],
  },
  {
    label: 'PHÁT TRIỂN',
    links: [
      { to: '/goals', label: 'Mục tiêu', icon: Target },
      { to: '/study', label: 'Tập trung', icon: Timer },
      { to: '/statistics', label: 'Thống kê', icon: BarChart3 },
    ],
  },
  ...(aiFeaturesEnabled ? [{ label: 'HỖ TRỢ', links: [{ to: '/ai-coach', label: 'AI Coach', icon: BrainCircuit }] }] : []),
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const roles = useAuthStore((state) => state.roles)
  const isAdmin = roles.includes('admin')
  const invitations = useGroupInvitationsQuery()
  const invitationCount = invitations.data?.length ?? 0
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
    <div className="sidebar-head"><Logo /><button className="icon-button mobile-only" onClick={onClose} aria-label="Đóng menu"><X size={18} /></button></div>
    <nav className="sidebar-navigation" aria-label="Điều hướng chính">
      {navigationSections.map((section) => <section className="nav-section" key={section.label} aria-label={section.label}>
        <p className="nav-section-label">{section.label}</p>
        <div className="nav-list">
          {section.links.map(({ to, label, icon: Icon, invitationCount: showsInvitationCount }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Icon size={18} aria-hidden="true" /><span>{label}</span>{showsInvitationCount && invitationCount > 0 && <span className="nav-invitation-count" aria-label={`${invitationCount} lời mời đang chờ`}>{invitationCount > 99 ? '99+' : invitationCount}</span>}
          </NavLink>)}
        </div>
      </section>)}
      <section className="nav-section nav-section-account" aria-label="TÀI KHOẢN">
        <p className="nav-section-label">TÀI KHOẢN</p>
        <div className="nav-list">
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Settings size={18} aria-hidden="true" /><span>Cài đặt</span></NavLink>
          {isAdmin && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><ShieldCheck size={18} aria-hidden="true" /><span>Quản trị</span></NavLink>}
        </div>
      </section>
    </nav>
    <div className="sidebar-footer">
      <div className="sidebar-forest-decoration" aria-hidden="true"><img src={natureAssets.flora.bush[0]} alt="" /></div>
      <div className="study-tip"><span className="tip-dot" /><div><strong>Giữ nhịp học tập</strong><p>Tiến từng bước nhỏ hôm nay.</p></div></div>
    </div>
  </aside>
}
