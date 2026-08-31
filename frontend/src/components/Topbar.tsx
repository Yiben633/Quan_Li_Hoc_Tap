import { Bell, Leaf, Menu, Search } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { notificationRoute, type NotificationItem } from '../features/notifications/notifications.api'
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from '../features/notifications/notifications.hooks'
import { Dropdown, Modal, Skeleton } from './ui'
import { ThemeToggle } from './ThemeToggle'
import { UserAccountMenu } from './UserAccountMenu'

type ContextualSearch = { path: string; placeholder: string; label: string }

const contextualSearches: Record<string, ContextualSearch> = {
  '/tasks': { path: '/tasks', placeholder: 'Tìm công việc...', label: 'Tìm công việc' },
  '/notes': { path: '/notes', placeholder: 'Tìm ghi chú...', label: 'Tìm ghi chú' },
  '/topics': { path: '/topics', placeholder: 'Tìm môn học...', label: 'Tìm môn học' },
}

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}

export function Topbar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [contextualQuery, setContextualQuery] = useState('')
  const notifications = useNotificationsQuery({ isRead: false, page: 1, limit: 5 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()
  const unread = notifications.data?.pagination.total ?? 0
  const contextualSearch = contextualSearches[location.pathname]

  useEffect(() => {
    setContextualQuery(contextualSearch ? new URLSearchParams(location.search).get('search') ?? '' : '')
  }, [contextualSearch, location.search])

  const submitContextualSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!contextualSearch) return

    const params = new URLSearchParams(location.search)
    const query = contextualQuery.trim()
    if (query) params.set('search', query)
    else params.delete('search')
    if (contextualSearch.path === '/tasks' && query) params.delete('scope')
    navigate({ pathname: contextualSearch.path, search: params.size ? `?${params.toString()}` : '' })
  }

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
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="Mở menu" aria-controls="app-navigation" aria-expanded={menuOpen}><Menu size={20} /></button>
      {contextualSearch && <><form className="topbar-search" role="search" onSubmit={submitContextualSearch}>
        <Search size={17} aria-hidden="true" />
        <input value={contextualQuery} onChange={(event) => setContextualQuery(event.target.value)} placeholder={contextualSearch.placeholder} aria-label={contextualSearch.label} />
      </form><span className="topbar-leaf-divider" aria-hidden="true"><Leaf size={14} /></span></>}
      <div className="topbar-actions">
        <ThemeToggle />
        <Dropdown ariaLabel="Thông báo" label={<span className="notification-button"><Bell size={18} />{unread > 0 && <span className="notification-dot" />}</span>}>
          <div className="dropdown-header"><strong>Thông báo</strong>{unread > 0 && <span className="badge blue">{unread} mới</span>}</div>
          {notifications.isLoading ? <div className="notification-loading" aria-label="Đang tải thông báo" aria-busy="true"><Skeleton height={13} width="72%" /><Skeleton height={11} width="94%" /><Skeleton height={11} width="48%" /></div> : notifications.isError ? <p className="notification-empty">Không thể tải thông báo.</p> : notifications.data?.items.length ? <div className="notification-list">{notifications.data.items.map((item) => <button className="notification-item" key={item.id} onClick={() => openNotification(item)}><span className="notification-mark blue" /><span><strong>{item.title}</strong><p>{item.message}</p><small>{formatNotificationTime(item.createdAt)}</small></span></button>)}</div> : <p className="notification-empty">Bạn chưa có thông báo mới.</p>}
          {unread > 0 && <button className="dropdown-link" onClick={() => markAllRead.mutate()}>Đánh dấu tất cả đã đọc</button>}
          <Link className="dropdown-link" to="/notifications">Xem tất cả thông báo</Link>
        </Dropdown>
        <UserAccountMenu variant="topbar" />
      </div>
    </header>
    <Modal open={Boolean(selectedNotification)} title={selectedNotification?.title ?? 'Thông báo'} onClose={() => setSelectedNotification(null)}>
      <div className="notification-detail"><p>{selectedNotification?.message}</p>{selectedNotification && <time>{formatNotificationTime(selectedNotification.createdAt)}</time>}</div>
    </Modal>
  </>
}
