import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { ArrowLeft, CalendarDays, Edit3, GripVertical, LockKeyhole, MailPlus, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Avatar, Button, ConfirmDialog, DatePicker, EmptyState, IconButton, Input, Modal, ProgressBar, Select, Skeleton, Tabs, Textarea } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { GroupInput, GroupMember, GroupTask, GroupTaskInput, GroupTaskStatus, StudyGroupDetail } from '../features/groups/groups.api'
import { useGroupDeleteMutation, useGroupInviteMutation, useGroupProgressQuery, useGroupQuery, useGroupTaskCreateMutation, useGroupTaskUpdateMutation, useGroupUpdateMutation } from '../features/groups/groups.hooks'
import { useAuthStore } from '../stores/authStore'

const columns: Array<{ status: GroupTaskStatus; label: string }> = [
  { status: 'todo', label: 'Chưa bắt đầu' },
  { status: 'in_progress', label: 'Đang thực hiện' },
  { status: 'waiting', label: 'Đang chờ' },
  { status: 'done', label: 'Hoàn thành' },
]
const statusLabels = Object.fromEntries(columns.map((column) => [column.status, column.label])) as Record<GroupTaskStatus, string>

function GroupEditor({ group, open, onClose }: { group: StudyGroupDetail; open: boolean; onClose: () => void }) {
  const update = useGroupUpdateMutation()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description ?? '')
  useEffect(() => { if (open) { setName(group.name); setDescription(group.description ?? '') } }, [group, open])
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input: GroupInput = { name: name.trim(), description: description.trim() || null }
    if (!input.name) return
    update.mutate({ id: group.id, input }, { onSuccess: () => { toast.success('Đã cập nhật nhóm'); onClose() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật nhóm')) })
  }
  return <Modal open={open} title="Chỉnh sửa nhóm" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="group-edit-form" loading={update.isPending}>Lưu thay đổi</Button></>}><form id="group-edit-form" className="group-form" onSubmit={submit}><Input label="Tên nhóm" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} /><Textarea label="Mô tả (tùy chọn)" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} /></form></Modal>
}

function InviteEditor({ groupId, open, onClose }: { groupId: string; open: boolean; onClose: () => void }) {
  const invite = useGroupInviteMutation()
  const [email, setEmail] = useState('')
  useEffect(() => { if (open) setEmail('') }, [open])
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) return
    invite.mutate({ id: groupId, email: email.trim() }, { onSuccess: () => { toast.success('Đã gửi lời mời xác nhận'); onClose() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể gửi lời mời')) })
  }
  return <Modal open={open} title="Mời thành viên" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="group-invite-form" loading={invite.isPending}>Gửi lời mời</Button></>}><form id="group-invite-form" className="group-form" onSubmit={submit}><div className="privacy-note"><LockKeyhole size={18} /><div><strong>Cần người nhận xác nhận</strong><p>Email chỉ dùng để tìm đúng tài khoản và không hiển thị cho thành viên trong nhóm.</p></div></div><Input type="email" label="Email tài khoản" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" placeholder="ten@example.com" autoFocus /></form></Modal>
}

function TaskEditor({ group, open, onClose }: { group: StudyGroupDetail; open: boolean; onClose: () => void }) {
  const create = useGroupTaskCreateMutation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<GroupTaskStatus>('todo')
  const acceptedMembers = group.members.filter((member) => member.status === 'accepted')
  useEffect(() => { if (open) { setTitle(''); setDescription(''); setAssignedUserId(''); setDueDate(''); setStatus('todo') } }, [open])
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim()) return
    const input: GroupTaskInput = { title: title.trim(), description: description.trim() || null, assignedUserId: assignedUserId || null, dueDate: dueDate || null, status }
    create.mutate({ groupId: group.id, input }, { onSuccess: () => { toast.success('Đã thêm công việc nhóm'); onClose() }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể thêm công việc')) })
  }
  return <Modal open={open} title="Thêm công việc nhóm" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="group-task-form" loading={create.isPending}>Thêm công việc</Button></>}><form id="group-task-form" className="group-form" onSubmit={submit}><Input label="Tên công việc" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={240} autoFocus /><Textarea label="Mô tả (tùy chọn)" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={5000} /><div className="group-form-grid"><Select customMenu label="Người phụ trách" value={assignedUserId} onChange={(event) => setAssignedUserId(event.target.value)}><option value="">Chưa phân công</option>{acceptedMembers.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.fullName}</option>)}</Select><Select customMenu label="Trạng thái" value={status} onChange={(event) => setStatus(event.target.value as GroupTaskStatus)}>{columns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}</Select></div><DatePicker label="Hạn hoàn thành (tùy chọn)" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></form></Modal>
}

function GroupTaskCard({ groupId, task, members }: { groupId: string; task: GroupTask; members: GroupMember[] }) {
  const update = useGroupTaskUpdateMutation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const assignee = members.find((member) => member.user.id === task.assignedUserId)?.user
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  const changeStatus = (status: GroupTaskStatus) => update.mutate({ groupId, taskId: task.id, input: { status } }, { onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể đổi trạng thái')) })
  return <article ref={setNodeRef} style={style} className={`group-task-card${isDragging ? ' is-dragging' : ''}`}>
    <button type="button" className="group-task-handle" aria-label={`Kéo công việc ${task.title}`} {...listeners} {...attributes}><GripVertical size={16} /></button>
    <div className="group-task-copy"><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<div>{assignee && <span><UserRound size={13} /> {assignee.fullName}</span>}{task.dueDate && <span><CalendarDays size={13} /> {new Date(task.dueDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</span>}</div></div>
    <Select customMenu aria-label={`Trạng thái của ${task.title}`} value={task.status} onChange={(event) => changeStatus(event.target.value as GroupTaskStatus)}>{columns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}</Select>
  </article>
}

function GroupColumn({ groupId, status, label, tasks, members }: { groupId: string; status: GroupTaskStatus; label: string; tasks: GroupTask[]; members: GroupMember[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return <section ref={setNodeRef} className={`group-kanban-column status-${status}${isOver ? ' is-over' : ''}`}><header><span /><h2>{label}</h2><strong>{tasks.length}</strong></header><div>{tasks.length ? tasks.map((task) => <GroupTaskCard key={task.id} groupId={groupId} task={task} members={members} />) : <p className="group-column-empty">Chưa có công việc</p>}</div></section>
}

export function StudyGroupDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const group = useGroupQuery(id)
  const progress = useGroupProgressQuery(id)
  const updateTask = useGroupTaskUpdateMutation()
  const remove = useGroupDeleteMutation()
  const [tab, setTab] = useState<'tasks' | 'members'>('tasks')
  const [editOpen, setEditOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const board = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, group.data?.tasks.filter((task) => task.status === column.status) ?? []])) as Record<GroupTaskStatus, GroupTask[]>, [group.data?.tasks])
  const isOwner = group.data?.ownerId === currentUserId

  const onDragEnd = (event: DragEndEvent) => {
    const task = group.data?.tasks.find((item) => item.id === String(event.active.id))
    const status = String(event.over?.id ?? '') as GroupTaskStatus
    if (!task || !columns.some((column) => column.status === status) || task.status === status) return
    updateTask.mutate({ groupId: id, taskId: task.id, input: { status } }, { onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể di chuyển công việc')) })
  }

  if (group.isLoading) return <div className="group-detail-skeleton"><Skeleton height={180} /><Skeleton height={430} /></div>
  if (group.isError || !group.data) return <EmptyState icon={<Users size={24} />} title="Không thể mở nhóm" description="Bạn không có quyền truy cập hoặc nhóm không còn tồn tại." action={<Button onClick={() => navigate('/groups')}>Quay lại danh sách</Button>} />

  const data = group.data
  return <div className="group-detail-page">
    <Link className="back-link" to="/groups"><ArrowLeft size={15} /> Quay lại nhóm chia sẻ</Link>
    <header className="group-detail-hero"><div><span className="private-badge"><LockKeyhole size={13} /> Nhóm riêng tư</span><h1>{data.name}</h1>{data.description && <p>{data.description}</p>}</div><div className="group-detail-actions">{isOwner && <><Button variant="secondary" onClick={() => setInviteOpen(true)}><MailPlus size={16} /> Mời thành viên</Button><IconButton label="Chỉnh sửa nhóm" onClick={() => setEditOpen(true)}><Edit3 size={17} /></IconButton><IconButton label="Xóa nhóm" onClick={() => setDeleteOpen(true)}><Trash2 size={17} /></IconButton></>}<Button onClick={() => setTaskOpen(true)}><Plus size={16} /> Công việc</Button></div></header>
    <section className="group-progress"><div><span>Tiến độ công việc</span><strong>{progress.data?.doneTasks ?? 0}/{progress.data?.totalTasks ?? data.tasks.length} đã hoàn thành</strong></div><ProgressBar value={progress.data?.progressPercent ?? 0} /></section>
    <Tabs value={tab} onChange={setTab} items={[{ value: 'tasks', label: `Công việc (${data.tasks.length})` }, { value: 'members', label: `Thành viên (${data.members.filter((member) => member.status === 'accepted').length})` }]} />
    {tab === 'tasks' && <DndContext sensors={sensors} onDragEnd={onDragEnd}><div className="group-kanban">{columns.map((column) => <GroupColumn key={column.status} groupId={id} status={column.status} label={column.label} tasks={board[column.status]} members={data.members} />)}</div></DndContext>}
    {tab === 'members' && <section className="group-member-list">{data.members.map((member) => <article key={member.id}><Avatar name={member.user.fullName} src={member.user.avatarUrl ?? undefined} /><div><strong>{member.user.fullName}</strong><span>{member.role === 'leader' ? 'Trưởng nhóm' : 'Thành viên'} · {member.status === 'accepted' ? 'Đã tham gia' : member.status === 'pending' ? 'Đang chờ xác nhận' : 'Đã từ chối'}</span></div></article>)}</section>}
    <GroupEditor group={data} open={editOpen} onClose={() => setEditOpen(false)} />
    <InviteEditor groupId={id} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    <TaskEditor group={data} open={taskOpen} onClose={() => setTaskOpen(false)} />
    <ConfirmDialog open={deleteOpen} title="Xóa nhóm?" description="Toàn bộ công việc nhóm sẽ bị xóa vĩnh viễn. Thành viên sẽ không thể truy cập lại nhóm này." onCancel={() => setDeleteOpen(false)} onConfirm={() => remove.mutate(id, { onSuccess: () => { toast.success('Đã xóa nhóm'); navigate('/groups') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa nhóm')) })} loading={remove.isPending} />
  </div>
}
