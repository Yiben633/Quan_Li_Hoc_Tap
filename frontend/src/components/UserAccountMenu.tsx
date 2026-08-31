import { LogOut, Settings, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Avatar, Dropdown } from './ui'

type UserAccountMenuProps = {
  variant: 'topbar' | 'sidebar'
  collapsed?: boolean
  onNavigate?: () => void
}

function accountRole(roles: string[]) {
  if (roles.includes('admin')) return 'Quản trị viên'
  if (roles.includes('teacher')) return 'Giảng viên'
  if (roles.includes('student')) return 'Sinh viên'
  return roles[0] ?? 'Thành viên'
}

export function UserAccountMenu({ variant, collapsed = false, onNavigate }: UserAccountMenuProps) {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const name = user?.fullName ?? 'Bạn'
  const role = accountRole(user?.roles ?? [])
  const avatarSrc = user?.avatarUrl ?? undefined
  const sidebar = variant === 'sidebar'

  const label = sidebar
    ? <><Avatar name={name} src={avatarSrc} size="sm" /><span className="sidebar-user-copy"><strong>{name}</strong><small>{role}</small></span></>
    : <><Avatar name={name} src={avatarSrc} size="sm" /><span className="user-name">{name}</span></>

  return <div className={`user-account-menu user-account-menu-${variant}${collapsed ? ' is-collapsed' : ''}`} data-tooltip={collapsed ? `${name} - ${role}` : undefined}>
    <Dropdown ariaLabel={`Tài khoản của ${name}`} label={label} showChevron={!collapsed}>
      <div className="user-menu-head"><Avatar name={name} src={avatarSrc} /><div><strong>{name}</strong><p>{user?.email ?? ''}</p></div></div>
      <Link className="menu-item" to="/settings" onClick={onNavigate}><UserRound size={16} /> Hồ sơ cá nhân</Link>
      <Link className="menu-item" to="/settings" onClick={onNavigate}><Settings size={16} /> Cài đặt</Link>
      <button className="menu-item danger-text" onClick={clearSession}><LogOut size={16} /> Đăng xuất</button>
    </Dropdown>
  </div>
}
