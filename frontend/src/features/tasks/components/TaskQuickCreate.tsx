import { ChevronDown, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Input, Select } from '../../../components/ui'
import type { Priority, StudyPlan, Task } from '../tasks.api'
import { DIFFICULTY_LABELS, PRIORITY_LABELS } from '../task.constants'
import { useTaskCreateMutation } from '../tasks.hooks'

type TopicOption = { id: string; code: string; name: string }

type TaskQuickCreateProps = {
  subjectId?: string
  studyPlanId?: string
  defaultPriority?: Priority
  onCreated?: (task: Task) => void
  topics?: TopicOption[]
  plans?: StudyPlan[]
  focusKey?: number
}

const estimatedMinuteOptions = [15, 25, 30, 45, 60, 90]

export function TaskQuickCreate({ subjectId, studyPlanId, defaultPriority = 'medium', onCreated, topics = [], plans = [], focusKey = 0 }: TaskQuickCreateProps) {
  const [title, setTitle] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId ?? '')
  const [selectedPlanId, setSelectedPlanId] = useState(studyPlanId ?? '')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>(defaultPriority)
  const [estimatedMinutes, setEstimatedMinutes] = useState('30')
  const [difficulty, setDifficulty] = useState('')
  const [description, setDescription] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const createMutation = useTaskCreateMutation()

  useEffect(() => {
    if (!focusKey) return
    setExpanded(true)
    titleInputRef.current?.focus()
  }, [focusKey])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedTitle = title.trim()
    if (!normalizedTitle) return

    createMutation.mutate({
      title: normalizedTitle,
      subjectId: subjectId ?? (selectedSubjectId || null),
      studyPlanId: studyPlanId ?? (selectedPlanId || null),
      dueDate: dueDate || null,
      priority,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      difficulty: difficulty ? Number(difficulty) : null,
      description: description.trim() || null,
      status: 'todo',
    }, {
      onSuccess: (task) => {
        setTitle('')
        setDueDate('')
        setDifficulty('')
        setDescription('')
        setExpanded(false)
        setAdvancedOpen(false)
        toast.success('Đã thêm công việc')
        onCreated?.(task)
      },
      onError: () => toast.error('Không thể tạo công việc'),
    })
  }

  return <section className={`task-quick-create panel${expanded ? ' is-expanded' : ''}`}>
    <form onSubmit={submit}>
      <div className="task-quick-primary"><Plus size={18} /><input ref={titleInputRef} value={title} onFocus={() => setExpanded(true)} onChange={(event) => setTitle(event.target.value)} placeholder="Thêm công việc nhanh..." aria-label="Tên công việc nhanh" /><Button type="submit" disabled={!title.trim()} loading={createMutation.isPending}>Thêm</Button></div>
      {expanded && <div className="task-quick-options">
        {!subjectId && <Select customMenu value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} aria-label="Chọn chủ đề"><option value="">Môn học</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select>}
        <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} aria-label="Deadline" />
        <Select customMenu value={priority} onChange={(event) => setPriority(event.target.value as Priority)} aria-label="Độ ưu tiên">{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Select customMenu value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)} aria-label="Thời gian dự kiến">{estimatedMinuteOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}</Select>
        <button type="button" className="task-quick-advanced-toggle" onClick={() => setAdvancedOpen((current) => !current)} aria-expanded={advancedOpen}>Thêm chi tiết <ChevronDown size={14} /></button>
      </div>}
      {expanded && advancedOpen && <div className="task-quick-advanced">
        {!studyPlanId && <Select label="Kế hoạch (tùy chọn)" customMenu value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}><option value="">Không gắn kế hoạch</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</Select>}
        <Select label="Độ khó" customMenu value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">Chưa chọn độ khó</option>{Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        <Input label="Mô tả" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ghi chú ngắn cho công việc" />
      </div>}
    </form>
  </section>
}
