import { Archive, CalendarDays, Edit3, Plus, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, ConfirmDialog, DatePicker, EmptyState, Input, Modal, ProgressBar, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { Goal, GoalInput, GoalStatus, GoalType } from '../features/goals/goals.api'
import { useGoalArchiveMutation, useGoalCreateMutation, useGoalsQuery, useGoalUpdateMutation } from '../features/goals/goals.hooks'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { formatTaskDeadline } from '../utils/taskDate'

const goalTypeLabels: Record<GoalType, string> = {
  score: 'Điểm số',
  study_time: 'Thời gian học',
  task_count: 'Số công việc',
  course_completion: 'Hoàn thành môn học',
  gpa: 'GPA',
}

const goalStatusLabels: Record<GoalStatus, string> = {
  in_progress: 'Đang theo dõi',
  achieved: 'Đã đạt',
  failed: 'Chưa đạt',
  archived: 'Đã lưu trữ',
}

const goalStatusTone: Record<GoalStatus, 'blue' | 'green' | 'orange' | 'neutral'> = {
  in_progress: 'blue',
  achieved: 'green',
  failed: 'orange',
  archived: 'neutral',
}

type GoalFormValues = {
  name: string
  type: GoalType
  targetValue: string
  subjectId: string
  deadline: string
  status: GoalStatus
}

function getFormValues(goal?: Goal): GoalFormValues {
  return {
    name: goal?.name ?? '',
    type: goal?.type ?? 'task_count',
    targetValue: goal ? String(Math.round(goal.targetValue)) : '',
    subjectId: goal?.subjectId ?? '',
    deadline: goal?.deadline?.slice(0, 10) ?? '',
    status: goal?.status ?? 'in_progress',
  }
}

function formatGoalValue(value: number, type: GoalType) {
  const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
  if (type === 'study_time') return `${formatted} phút`
  if (type === 'course_completion') return `${formatted}%`
  return formatted
}

function GoalEditor({ goal, open, onClose }: { goal?: Goal; open: boolean; onClose: () => void }) {
  const topics = useTopicsQuery()
  const create = useGoalCreateMutation()
  const update = useGoalUpdateMutation()
  const [values, setValues] = useState<GoalFormValues>(() => getFormValues(goal))

  useEffect(() => {
    if (open) setValues(getFormValues(goal))
  }, [goal, open])

  const pending = create.isPending || update.isPending
  const set = <Key extends keyof GoalFormValues>(key: Key, value: GoalFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const targetValue = Number(values.targetValue)
    if (!values.name.trim()) {
      toast.error('Hãy nhập tên mục tiêu')
      return
    }
    if (!Number.isInteger(targetValue) || targetValue <= 0) {
      toast.error('Giá trị mục tiêu phải là số nguyên lớn hơn 0')
      return
    }

    const input: GoalInput = {
      name: values.name.trim(),
      type: values.type,
      targetValue,
      subjectId: values.subjectId || null,
      deadline: values.deadline || null,
      status: values.status,
    }
    const callbacks = {
      onSuccess: () => {
        toast.success(goal ? 'Đã cập nhật mục tiêu' : 'Đã tạo mục tiêu')
        onClose()
      },
      onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể lưu mục tiêu')),
    }
    if (goal) update.mutate({ id: goal.id, input }, callbacks)
    else create.mutate(input, callbacks)
  }

  return <Modal open={open} title={goal ? 'Chỉnh sửa mục tiêu' : 'Tạo mục tiêu'} onClose={onClose} footer={<><Button type="button" variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="goal-form" loading={pending}>{goal ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</Button></>}>
    <form id="goal-form" className="goal-form" onSubmit={submit} noValidate>
      <Input label="Tên mục tiêu" value={values.name} onChange={(event) => set('name', event.target.value)} placeholder="Ví dụ: Hoàn thành 12 buổi tập trung" autoFocus />
      <div className="goal-form-grid">
        <Select customMenu label="Loại mục tiêu" value={values.type} onChange={(event) => set('type', event.target.value as GoalType)}>
          {Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Input
          label="Giá trị mục tiêu"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={values.targetValue}
          onChange={(event) => {
            const nextValue = event.target.value
            if (nextValue === '' || /^\d+$/.test(nextValue)) set('targetValue', nextValue)
          }}
        />
      </div>
      <div className="goal-form-grid">
        <Select customMenu label="Môn học (tùy chọn)" value={values.subjectId} onChange={(event) => set('subjectId', event.target.value)}>
          <option value="">Không gắn môn học</option>
          {topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}
        </Select>
        <DatePicker label="Hạn hoàn thành (tùy chọn)" value={values.deadline} onChange={(event) => set('deadline', event.target.value)} />
      </div>
      {goal && <Select customMenu label="Trạng thái" value={values.status} onChange={(event) => set('status', event.target.value as GoalStatus)}>
        {Object.entries(goalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>}
    </form>
  </Modal>
}

function GoalCard({ goal, subjectName, onEdit, onArchive }: { goal: Goal; subjectName?: string; onEdit: () => void; onArchive: () => void }) {
  return <article className="goal-card">
    <div className="goal-card-head">
      <span className={`goal-status ${goalStatusTone[goal.status]}`}>{goalStatusLabels[goal.status]}</span>
      <Button variant="ghost" className="goal-edit-button" onClick={onEdit} aria-label={`Chỉnh sửa mục tiêu ${goal.name}`}><Edit3 size={16} /></Button>
    </div>
    <div>
      <p className="goal-type">{goalTypeLabels[goal.type]}</p>
      <h2>{goal.name}</h2>
      {subjectName && <p className="subtle">{subjectName}</p>}
    </div>
    <div className="goal-value"><strong>{formatGoalValue(goal.currentValue, goal.type)}</strong><span>/ {formatGoalValue(goal.targetValue, goal.type)}</span></div>
    <ProgressBar value={goal.progressPercent} label="Tiến độ" tone={goal.status === 'achieved' ? 'green' : goal.status === 'failed' ? 'orange' : 'blue'} />
    <div className="goal-card-foot">
      <span><CalendarDays size={15} /> {formatTaskDeadline(goal.deadline)}</span>
      {goal.status !== 'archived' && <Button variant="ghost" className="goal-archive-button" onClick={onArchive}><Archive size={15} /> Lưu trữ</Button>}
    </div>
  </article>
}

export function GoalsPage() {
  const [status, setStatus] = useState<GoalStatus | ''>('')
  const [type, setType] = useState<GoalType | ''>('')
  const [editorGoal, setEditorGoal] = useState<Goal | undefined>()
  const [editorOpen, setEditorOpen] = useState(false)
  const [archiveGoal, setArchiveGoal] = useState<Goal | null>(null)
  const filters = useMemo(() => ({ ...(status ? { status } : {}), ...(type ? { type } : {}) }), [status, type])
  const query = useGoalsQuery(filters)
  const archive = useGoalArchiveMutation()
  const topics = useTopicsQuery()
  const subjectById = useMemo(() => new Map(topics.data?.items.map((topic) => [topic.id, topic.code ? `${topic.code} · ${topic.name}` : topic.name])), [topics.data])

  const openCreate = () => {
    setEditorGoal(undefined)
    setEditorOpen(true)
  }
  const openEdit = (goal: Goal) => {
    setEditorGoal(goal)
    setEditorOpen(true)
  }
  const closeEditor = () => setEditorOpen(false)

  return <div className="goals-page">
    <div className="page-heading goals-heading">
      <div>
        <p className="eyebrow">ĐỊNH HƯỚNG CỦA BẠN</p>
        <h1>Mục tiêu</h1>
        <p className="subtle">Theo dõi những điều bạn muốn hoàn thành theo nhịp của riêng mình.</p>
      </div>
      <Button onClick={openCreate}><Plus size={17} /> Tạo mục tiêu</Button>
    </div>

    <section className="goals-toolbar" aria-label="Lọc mục tiêu">
      <Select customMenu aria-label="Lọc trạng thái mục tiêu" value={status} onChange={(event) => setStatus(event.target.value as GoalStatus | '')}>
        <option value="">Mọi trạng thái</option>
        {Object.entries(goalStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Select customMenu aria-label="Lọc loại mục tiêu" value={type} onChange={(event) => setType(event.target.value as GoalType | '')}>
        <option value="">Mọi loại mục tiêu</option>
        {Object.entries(goalTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
    </section>

    {query.isLoading && <div className="goal-grid">{Array.from({ length: 3 }, (_, index) => <div className="goal-card goal-skeleton" key={index}><Skeleton height={18} width="35%" /><Skeleton height={27} width="65%" /><Skeleton height={15} width="45%" /><Skeleton height={8} /></div>)}</div>}
    {query.isError && <EmptyState icon={<Target size={24} />} title="Không thể tải mục tiêu" description="Kiểm tra kết nối rồi thử lại nhé." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />}
    {!query.isLoading && !query.isError && query.data?.length === 0 && <EmptyState icon={<Target size={24} />} title="Chưa có mục tiêu nào" description="Bạn có thể bắt đầu bằng một mục tiêu nhỏ, rõ ràng và phù hợp với mình." action={<Button onClick={openCreate}><Plus size={16} /> Tạo mục tiêu</Button>} />}
    {!query.isLoading && !query.isError && Boolean(query.data?.length) && <div className="goal-grid">{query.data?.map((goal) => <GoalCard key={goal.id} goal={goal} subjectName={goal.subjectId ? subjectById.get(goal.subjectId) : undefined} onEdit={() => openEdit(goal)} onArchive={() => setArchiveGoal(goal)} />)}</div>}

    <GoalEditor goal={editorGoal} open={editorOpen} onClose={closeEditor} />
    <ConfirmDialog open={Boolean(archiveGoal)} title="Lưu trữ mục tiêu" description={`Lưu trữ mục tiêu “${archiveGoal?.name ?? ''}”? Bạn vẫn có thể xem lại trong bộ lọc mục tiêu đã lưu trữ.`} onCancel={() => setArchiveGoal(null)} onConfirm={() => { if (!archiveGoal) return; archive.mutate(archiveGoal.id, { onSuccess: () => { toast.success('Đã lưu trữ mục tiêu'); setArchiveGoal(null) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể lưu trữ mục tiêu')) }) }} loading={archive.isPending} />
  </div>
}
