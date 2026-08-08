import { Bell, CheckCheck, ExternalLink, Inbox } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyState, Modal, Pagination, Skeleton, Switch } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { notificationRoute, type NotificationItem } from '../features/notifications/notifications.api'
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation, useNotificationsQuery } from '../features/notifications/notifications.hooks'

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value))
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<NotificationItem | null>(null)
  const query = useNotificationsQuery({ ...(unreadOnly ? { isRead: false } : {}), page, limit: 20 })
  const markRead = useMarkNotificationReadMutation()
  const markAllRead = useMarkAllNotificationsReadMutation()

  const changeUnreadOnly = (checked: boolean) => {
    setUnreadOnly(checked)
    setPage(1)
  }

  const openNotification = (item: NotificationItem) => {
    const openTarget = () => {
      const route = notificationRoute(item)
      if (route) navigate(route)
      else setSelected(item)
    }
    if (item.isRead) {
      openTarget()
      return
    }
    markRead.mutate(item.id, { onSuccess: openTarget, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật thông báo')) })
  }

  const data = query.data
  return <div className="notifications-page">
    <div className="page-heading notifications-heading">
      <div>
        <p className="eyebrow">CẬP NHẬT CỦA BẠN</p>
        <h1>Thông báo</h1>
        <p className="subtle">Các nhắc nhở và cập nhật gần đây trong không gian của bạn.</p>
      </div>
      <Button variant="secondary" onClick={() => markAllRead.mutate(undefined, { onSuccess: (result) => { if (result.updated) toast.success('Đã đánh dấu tất cả là đã đọc') } })} loading={markAllRead.isPending} disabled={!data?.items.some((item) => !item.isRead)}><CheckCheck size={17} /> Đánh dấu tất cả đã đọc</Button>
    </div>

    <section className="notifications-toolbar">
      <Switch label="Chỉ hiển thị chưa đọc" checked={unreadOnly} onChange={(event) => changeUnreadOnly(event.target.checked)} />
      {data && <span className="subtle">{data.pagination.total} thông báo</span>}
    </section>

    {query.isLoading && <div className="notification-page-list">{Array.from({ length: 5 }, (_, index) => <div className="notification-page-skeleton" key={index}><Skeleton width="55%" height={17} /><Skeleton width="80%" height={14} /><Skeleton width="28%" height={12} /></div>)}</div>}
    {query.isError && <EmptyState icon={<Bell size={24} />} title="Không thể tải thông báo" description="Kiểm tra kết nối rồi thử lại nhé." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />}
    {!query.isLoading && !query.isError && data?.items.length === 0 && <EmptyState icon={<Inbox size={24} />} title={unreadOnly ? 'Bạn không có thông báo chưa đọc' : 'Chưa có thông báo'} description="Các cập nhật mới sẽ xuất hiện tại đây." />}
    {!query.isLoading && !query.isError && Boolean(data?.items.length) && <div className="notification-page-list">{data?.items.map((item) => {
      const route = notificationRoute(item)
      return <button type="button" className={`notification-page-item${item.isRead ? ' is-read' : ''}`} key={item.id} onClick={() => openNotification(item)} aria-label={`${item.isRead ? 'Mở' : 'Đánh dấu đã đọc và mở'} thông báo: ${item.title}`}>
        <span className="notification-page-dot" aria-hidden="true" />
        <span className="notification-page-copy"><span className="notification-page-title"><strong>{item.title}</strong>{!item.isRead && <em>Chưa đọc</em>}</span><span>{item.message}</span><time>{formatNotificationTime(item.createdAt)}</time></span>
        {route && <ExternalLink className="notification-page-route" size={16} aria-hidden="true" />}
      </button>
    })}</div>}
    {!query.isLoading && !query.isError && (data?.pagination.totalPages ?? 0) > 1 && <Pagination page={data?.pagination.page ?? page} totalPages={data?.pagination.totalPages ?? 1} onChange={setPage} />}

    <Modal open={Boolean(selected)} title={selected?.title ?? 'Thông báo'} onClose={() => setSelected(null)} footer={<Button onClick={() => setSelected(null)}>Đã hiểu</Button>}>
      <div className="notification-detail"><p>{selected?.message}</p>{selected && <time>{formatNotificationTime(selected.createdAt)}</time>}</div>
    </Modal>
  </div>
}
