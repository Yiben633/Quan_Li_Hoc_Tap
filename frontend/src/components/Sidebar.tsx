import { NavLink, useLocation } from 'react-router-dom'
import { BarChart3, BookOpen, BookOpenCheck, BrainCircuit, CalendarDays, CheckSquare, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, FileText, LayoutDashboard, ListTodo, NotebookPen, Settings, ShieldCheck, Target, Timer, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Logo } from './Logo'
import { UserAccountMenu } from './UserAccountMenu'
import { useAuthStore } from '../stores/authStore'
import { aiFeaturesEnabled } from '../config/features'
import { useGroupInvitationsQuery } from '../features/groups/groups.hooks'
import { natureAssets } from '../config/natureAssets'
import { useMediaQuery } from '../hooks/useMediaQuery'

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

const resourceLinks: SidebarLink[] = [
  { to: '/documents', label: 'Tài liệu', icon: FileText },
  { to: '/notes', label: 'Ghi chú', icon: NotebookPen },
  { to: '/flashcards', label: 'Thẻ ghi nhớ', icon: BookOpenCheck },
  { to: '/groups', label: 'Nhóm chia sẻ', icon: Users, invitationCount: true },
]

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: { open: boolean; onClose: () => void; collapsed: boolean; onToggleCollapse: () => void }) {
  const roles = useAuthStore((state) => state.roles)
  const isAdmin = roles.includes('admin')
  const location = useLocation()
  const invitations = useGroupInvitationsQuery()
  const invitationCount = invitations.data?.length ?? 0
  const isDrawerViewport = useMediaQuery('(max-width: 1024px)')
  const isCollapsed = collapsed && !isDrawerViewport
  const resourceRouteActive = resourceLinks.some((link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`))
  const [resourcesOpen, setResourcesOpen] = useState(resourceRouteActive)
  const sidebarRef = useRef<HTMLElement>(null)
  const navigationRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    if (isDrawerViewport && !open) {
      sidebar.setAttribute('inert', '')
      return
    }

    sidebar.removeAttribute('inert')
    if (isDrawerViewport && open) navigationRef.current?.querySelector<HTMLAnchorElement>('a[href]')?.focus()
  }, [isDrawerViewport, open])

  useEffect(() => {
    if (resourceRouteActive) setResourcesOpen(true)
  }, [resourceRouteActive])

  const renderNavLink = ({ to, label, icon: Icon, invitationCount: showsInvitationCount }: SidebarLink) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose} aria-label={isCollapsed ? label : undefined} data-tooltip={isCollapsed ? label : undefined}>
    <Icon size={18} aria-hidden="true" /><span>{label}</span>{showsInvitationCount && invitationCount > 0 && <span className="nav-invitation-count" aria-label={`${invitationCount} lời mời đang chờ`}>{invitationCount > 99 ? '99+' : invitationCount}</span>}
  </NavLink>

  return <aside ref={sidebarRef} id="app-navigation" className={`sidebar ${open ? 'sidebar-open' : ''}${isCollapsed ? ' sidebar-collapsed' : ''}`} aria-hidden={isDrawerViewport && !open ? true : undefined}>
    <div className="sidebar-head"><Logo collapsed={isCollapsed} /><button className="icon-button sidebar-collapse-button" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} aria-controls="app-navigation" aria-expanded={!isCollapsed} title={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}>{isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}</button><button className="icon-button mobile-only" onClick={onClose} aria-label="Đóng menu"><X size={18} /></button></div>
    <nav ref={navigationRef} className="sidebar-navigation" aria-label="Điều hướng chính">
      {navigationSections.map((section) => <section className="nav-section" key={section.label} aria-label={section.label}>
        <p className="nav-section-label">{section.label}</p>
        <div className="nav-list">
          {section.links.map(renderNavLink)}
        </div>
      </section>)}
      <section className="nav-section nav-section-resources" aria-label="TÀI NGUYÊN">
        {!isCollapsed && <button type="button" className="nav-section-toggle" onClick={() => setResourcesOpen((current) => !current)} aria-expanded={resourcesOpen} aria-controls="sidebar-resource-links"><span>TÀI NGUYÊN</span>{resourcesOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}</button>}
        {(isCollapsed || resourcesOpen) && <div id="sidebar-resource-links" className="nav-list nav-resource-list">{resourceLinks.map(renderNavLink)}</div>}
      </section>
      <section className="nav-section nav-section-account" aria-label="TÀI KHOẢN">
        <p className="nav-section-label">TÀI KHOẢN</p>
        <div className="nav-list">
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose} aria-label={isCollapsed ? 'Cài đặt' : undefined} data-tooltip={isCollapsed ? 'Cài đặt' : undefined}><Settings size={18} aria-hidden="true" /><span>Cài đặt</span></NavLink>
          {isAdmin && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose} aria-label={isCollapsed ? 'Quản trị' : undefined} data-tooltip={isCollapsed ? 'Quản trị' : undefined}><ShieldCheck size={18} aria-hidden="true" /><span>Quản trị</span></NavLink>}
        </div>
      </section>
    </nav>
    <div className="sidebar-footer">
      <div className="sidebar-forest-decoration" aria-hidden="true"><img src={natureAssets.flora.bush[0]} alt="" width={543} height={724} loading="lazy" decoding="async" /></div>
      <div className="study-tip"><span className="tip-dot" /><div><strong>Giữ nhịp học tập</strong><p>Tiến từng bước nhỏ hôm nay.</p></div></div>
      <div className="sidebar-user-footer"><UserAccountMenu variant="sidebar" collapsed={isCollapsed} onNavigate={onClose} /></div>
    </div>
  </aside>
}
