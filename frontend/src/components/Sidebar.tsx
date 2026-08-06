import { NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, CheckSquare, Columns3, LayoutDashboard, Settings, Timer, Users, X } from 'lucide-react'
import { Logo } from './Logo'

const links = [{ to: '/', label: 'Tổng quan', icon: LayoutDashboard }, { to: '/tasks', label: 'Công việc', icon: CheckSquare }, { to: '/kanban', label: 'Kanban', icon: Columns3 }, { to: '/calendar', label: 'Lịch học', icon: CalendarDays }, { to: '/subjects', label: 'Không gian học', icon: BookOpen }, { to: '/study', label: 'Tập trung', icon: Timer }]
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-head"><Logo /><button className="icon-button mobile-only" onClick={onClose} aria-label="Đóng menu"><X size={18} /></button></div><nav className="nav-list" aria-label="Điều hướng chính">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Icon size={18} /><span>{label}</span></NavLink>)}<NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}><Settings size={18} /><span>Cài đặt</span></NavLink></nav><div className="sidebar-footer"><div className="study-tip"><span className="tip-dot" /><div><strong>Giữ nhịp học tập</strong><p>Hoàn thành một việc nhỏ hôm nay.</p></div></div><NavLink to="/admin" className="nav-link muted"><Users size={18} /><span>Quản trị</span></NavLink></div></aside>
}
