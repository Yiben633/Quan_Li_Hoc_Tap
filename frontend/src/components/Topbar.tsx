import { Bell, LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from '../features/notifications/notifications.hooks'
import { useAuthStore } from '../stores/authStore'
import { Avatar, Dropdown } from './ui'
import { ThemeToggle } from './ThemeToggle'

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const avatarSrc = user?.avatarUrl ?? undefined
  const notifications = useNotificationsQuery({ isRead: false, page: 1, limit: 5 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const unread = notifications.data?.pagination.total ?? 0

  return <header className="topbar"><button className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu"><Menu size={20} /></button><div className="topbar-spacer" /><div className="topbar-actions"><ThemeToggle /><Dropdown label={<span className="notification-button"><Bell size={18} />{unread > 0 && <span className="notification-dot" />}</span>}><div className="dropdown-header"><strong>Thông báo</strong>{unread > 0 && <span className="badge blue">{unread} mới</span>}</div>{notifications.isLoading ? <p className="notification-empty">Đang tải thông báo...</p> : notifications.isError ? <p className="notification-empty">Không thể tải thông báo.</p> : notifications.data?.items.length ? <div className="notification-list">{notifications.data.items.map((item) => <button className="notification-item" key={item.id} onClick={() => markRead.mutate(item.id)}><span className="notification-mark blue" /><span><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationTime(item.createdAt)}</small></span></button>)}</div> : <p className="notification-empty">Bạn chưa có thông báo mới.</p>}{unread > 0 && <button className="dropdown-link" onClick={() => markAllRead.mutate()}>Đánh dấu tất cả đã đọc</button>}</Dropdown><Dropdown label={<><Avatar name={user?.fullName ?? 'Bạn'} src={avatarSrc} size="sm" /><span className="user-name">{user?.fullName ?? 'Bạn'}</span></>}><div className="user-menu-head"><Avatar name={user?.fullName ?? 'Bạn'} src={avatarSrc} /><div><strong>{user?.fullName ?? 'Bạn'}</strong><p>{user?.email ?? ''}</p></div></div><Link className="menu-item" to="/settings"><UserRound size={16} /> Hồ sơ cá nhân</Link><Link className="menu-item" to="/settings"><Settings size={16} /> Cài đặt</Link><button className="menu-item danger-text" onClick={clearSession}><LogOut size={16} /> Đăng xuất</button></Dropdown></div></header>
}
