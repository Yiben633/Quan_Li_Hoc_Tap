import { ArrowRight, Inbox, ListChecks, LockKeyhole, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Button, EmptyState, Input, Modal, Skeleton, Textarea } from '../components/ui'
import { NatureEmptyState } from '../components/nature'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { GroupInput } from '../features/groups/groups.api'
import { useGroupCreateMutation, useGroupInvitationsQuery, useGroupsQuery, useInvitationAcceptMutation, useInvitationRejectMutation } from '../features/groups/groups.hooks'

function GroupEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const create = useGroupCreateMutation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => { if (open) { setName(''); setDescription('') } }, [open])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    const input: GroupInput = { name: name.trim(), description: description.trim() || null }
    create.mutate(input, {
      onSuccess: (group) => { toast.success('Đã tạo nhóm riêng tư'); onClose(); navigate(`/groups/${group.id}`) },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo nhóm')),
    })
  }

  return <Modal open={open} title="Tạo nhóm chia sẻ" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="group-form" loading={create.isPending}>Tạo nhóm</Button></>}>
    <form id="group-form" className="group-form" onSubmit={submit}>
      <div className="privacy-note"><LockKeyhole size={18} /><div><strong>Riêng tư theo mặc định</strong><p>Chỉ người được mời và đã xác nhận mới có thể xem nội dung nhóm.</p></div></div>
      <Input label="Tên nhóm" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} autoFocus placeholder="Ví dụ: Cùng luyện giao tiếp" />
      <Textarea label="Mô tả (tùy chọn)" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={4} />
    </form>
  </Modal>
}

export function StudyGroupsPage() {
  const groups = useGroupsQuery()
  const invitations = useGroupInvitationsQuery()
  const accept = useInvitationAcceptMutation()
  const reject = useInvitationRejectMutation()
  const [editorOpen, setEditorOpen] = useState(false)

  const respond = (groupId: string, memberId: string, accepted: boolean) => {
    const mutation = accepted ? accept : reject
    mutation.mutate({ groupId, memberId }, {
      onSuccess: () => toast.success(accepted ? 'Đã tham gia nhóm' : 'Đã từ chối lời mời'),
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xử lý lời mời')),
    })
  }

  return <div className="groups-page">
    <div className="page-heading groups-heading"><div><p className="eyebrow">CÙNG NHAU TIẾN BỘ</p><h1>Nhóm chia sẻ</h1><p className="subtle">Phối hợp công việc trong những nhóm riêng tư mà bạn tin tưởng.</p></div><Button onClick={() => setEditorOpen(true)}><Plus size={17} /> Tạo nhóm</Button></div>

    {Boolean(invitations.data?.length) && <section className="group-invitations" aria-labelledby="invitation-title">
      <div><span className="section-icon"><Inbox size={18} /></span><div><h2 id="invitation-title">Lời mời đang chờ</h2><p>Chỉ bạn mới có thể xác nhận các lời mời này.</p></div></div>
      <div className="invitation-list">{invitations.data?.map((invitation) => <article key={invitation.id}>
        <Avatar name={invitation.studyGroup.owner.fullName} src={invitation.studyGroup.owner.avatarUrl ?? undefined} />
        <div><strong>{invitation.studyGroup.name}</strong><span>Được mời bởi {invitation.studyGroup.owner.fullName}</span></div>
        <div><Button variant="secondary" onClick={() => respond(invitation.studyGroup.id, invitation.id, false)} loading={reject.isPending}>Từ chối</Button><Button onClick={() => respond(invitation.studyGroup.id, invitation.id, true)} loading={accept.isPending}>Tham gia</Button></div>
      </article>)}</div>
    </section>}

    {groups.isLoading && <div className="group-grid">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} height={220} />)}</div>}
    {groups.isError && <EmptyState icon={<Users size={24} />} title="Không thể tải nhóm" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => groups.refetch()}>Thử lại</Button>} />}
    {!groups.isLoading && !groups.isError && !groups.data?.length && <NatureEmptyState size="md" title="Bạn chưa tham gia nhóm nào." description="Học cùng nhau có thể giúp duy trì nhịp học." action={<Button onClick={() => setEditorOpen(true)}><Plus size={16} /> Tạo nhóm đầu tiên</Button>} />}
    {Boolean(groups.data?.length) && <div className="group-grid">{groups.data?.map((group) => <Link className="group-card" to={`/groups/${group.id}`} key={group.id}>
      <div className="group-card-head"><span><LockKeyhole size={14} /> Riêng tư</span><ArrowRight size={18} /></div>
      <div><h2>{group.name}</h2>{group.description && <p>{group.description}</p>}</div>
      <div className="group-card-stats"><span><Users size={15} /><strong>{group._count.members}</strong> thành viên</span><span><ListChecks size={15} /><strong>{group._count.tasks}</strong> công việc</span></div>
    </Link>)}</div>}
    <GroupEditor open={editorOpen} onClose={() => setEditorOpen(false)} />
  </div>
}
