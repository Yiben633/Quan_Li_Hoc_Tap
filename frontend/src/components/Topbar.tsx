import { Bell, LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { notificationRoute, type NotificationItem } from '../features/notifications/notifications.api'
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from '../features/notifications/notifications.hooks'
import { useAuthStore } from '../stores/authStore'
import { Avatar, Dropdown, Modal } from './ui'
import { ThemeToggle } from './ThemeToggle'

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const navigate = useNavigate()
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const avatarSrc = user?.avatarUrl ?? undefined
  const notifications = useNotificationsQuery({ isRead: false, page: 1, limit: 5 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const unread = notifications.data?.pagination.total ?? 0

  const openNotification = (item: NotificationItem) => {
    const route = notificationRoute(item)
    const continueToTarget = () => {
      if (route) navigate(route)
      else setSelectedNotification(item)
    }
    if (item.isRead) continueToTarget()
    else markRead.mutate(item.id, { onSuccess: continueToTarget })
  }

  return <>
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu"><Menu size={20} /></button>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <ThemeToggle />
        <Dropdown ariaLabel="Thông báo" label={<span className="notification-button"><Bell size={18} />{unread > 0 && <span className="notification-dot" />}</span>}>
          <div className="dropdown-header"><strong>Thông báo</strong>{unread > 0 && <span className="badge blue">{unread} mới</span>}</div>
          {notifications.isLoading ? <p className="notification-empty">Đang tải thông báo...</p> : notifications.isError ? <p className="notification-empty">Không thể tải thông báo.</p> : notifications.data?.items.length ? <div className="notification-list">{notifications.data.items.map((item) => <button className="notification-item" key={item.id} onClick={() => openNotification(item)}><span className="notification-mark blue" /><span><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationTime(item.createdAt)}</small></span></button>)}</div> : <p className="notification-empty">Bạn chưa có thông báo mới.</p>}
          {unread > 0 && <button className="dropdown-link" onClick={() => markAllRead.mutate()}>Đánh dấu tất cả đã đọc</button>}
          <Link className="dropdown-link" to="/notifications">Xem tất cả thông báo</Link>
        </Dropdown>
        <Dropdown ariaLabel="Tài khoản của bạn" label={<><Avatar name={user?.fullName ?? 'Bạn'} src={avatarSrc} size="sm" /><span className="user-name">{user?.fullName ?? 'Bạn'}</span></>}>
          <div className="user-menu-head"><Avatar name={user?.fullName ?? 'Bạn'} src={avatarSrc} /><div><strong>{user?.fullName ?? 'Bạn'}</strong><p>{user?.email ?? ''}</p></div></div>
          <Link className="menu-item" to="/settings"><UserRound size={16} /> Hồ sơ cá nhân</Link>
          <Link className="menu-item" to="/settings"><Settings size={16} /> Cài đặt</Link>
          <button className="menu-item danger-text" onClick={clearSession}><LogOut size={16} /> Đăng xuất</button>
        </Dropdown>
      </div>
    </header>
    <Modal open={Boolean(selectedNotification)} title={selectedNotification?.title ?? 'Thông báo'} onClose={() => setSelectedNotification(null)}>
      <div className="notification-detail"><p>{selectedNotification?.message}</p>{selectedNotification && <time>{formatNotificationTime(selectedNotification.createdAt)}</time>}</div>
    </Modal>
  </>
}
