import { CalendarDays, CheckSquare, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button, Modal, Select, Textarea } from '../../../components/ui'
import { formatTaskDate } from '../../../utils/taskDate'
import type { StudyPlan } from '../tasks.api'
import { useTaskCreateMutation } from '../tasks.hooks'

type Distribution = 'daily' | 'alternate' | 'even'
type BreakdownStep = 'edit' | 'preview'
type PreviewTask = { title: string; date: string }

const distributionLabels: Record<Distribution, string> = {
  daily: 'Mỗi ngày',
  alternate: 'Cách ngày',
  even: 'Phân bố đều',
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromValue(value?: string | null) {
  if (!value) {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

function scheduleTasks(titles: string[], start: Date, end: Date | null, distribution: Distribution): PreviewTask[] {
  const availableDays = end && end >= start ? daysBetween(start, end) : null
  return titles.map((title, index) => {
    const offset = distribution === 'alternate'
      ? index * 2
      : distribution === 'even' && availableDays !== null && titles.length > 1
        ? Math.round((availableDays * index) / (titles.length - 1))
        : index
    return { title, date: dateKey(addDays(start, offset)) }
  })
}

export function PlanBreakdownModal({ open, plan, onClose }: { open: boolean; plan: StudyPlan; onClose: () => void }) {
  const [lines, setLines] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('45')
  const [distribution, setDistribution] = useState<Distribution>('daily')
  const [step, setStep] = useState<BreakdownStep>('edit')
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const createTask = useTaskCreateMutation()
  const titles = useMemo(() => lines.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [lines])
  const startDate = useMemo(() => dateFromValue(plan.startDate), [plan.startDate])
  const endDate = useMemo(() => plan.endDate ? dateFromValue(plan.endDate) : null, [plan.endDate])
  const preview = useMemo(() => scheduleTasks(titles, startDate, endDate, distribution), [titles, startDate, endDate, distribution])
  const lastPreviewDate = preview.length ? dateFromValue(preview[preview.length - 1].date) : null
  const exceedsDeadline = Boolean(endDate && lastPreviewDate && lastPreviewDate > endDate)

  const reset = () => {
    setLines('')
    setEstimatedMinutes('45')
    setDistribution('daily')
    setStep('edit')
    setSelectedIndexes([])
  }

  const close = () => {
    if (isCreating) return
    reset()
    onClose()
  }

  const showPreview = () => {
    if (!titles.length) {
      toast.error('Hãy nhập ít nhất một công việc')
      return
    }
    setSelectedIndexes(preview.map((_, index) => index))
    setStep('preview')
  }

  const toggleTask = (index: number) => setSelectedIndexes((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])

  const createSelectedTasks = async () => {
    const selectedTasks = preview.filter((_, index) => selectedIndexes.includes(index))
    if (!selectedTasks.length) {
      toast.error('Hãy chọn ít nhất một công việc để tạo')
      return
    }
    setIsCreating(true)
    try {
      const results = await Promise.allSettled(selectedTasks.map((item) => createTask.mutateAsync({
        title: item.title,
        description: null,
        startDate: item.date,
        dueDate: item.date,
        estimatedMinutes: Number(estimatedMinutes),
        priority: plan.priority,
        status: 'todo',
        studyPlanId: plan.id,
        subjectId: plan.subjectId ?? null,
      })))
      const createdCount = results.filter((result) => result.status === 'fulfilled').length
      const failedCount = results.length - createdCount
      if (createdCount) toast.success(`Đã tạo ${createdCount} công việc`)
      if (failedCount) toast.error(`${failedCount} công việc chưa thể tạo`)
      if (!failedCount) close()
    } finally {
      setIsCreating(false)
    }
  }

  return <Modal open={open} title="Chia nhỏ kế hoạch" onClose={close} footer={step === 'edit' ? <><Button variant="secondary" onClick={close}>Hủy</Button><Button onClick={showPreview}><CheckSquare size={16} /> Xem trước</Button></> : <><Button variant="secondary" onClick={() => setStep('edit')} disabled={isCreating}><RotateCcw size={15} /> Chỉnh lại</Button><Button onClick={() => void createSelectedTasks()} loading={isCreating} disabled={selectedIndexes.length === 0}>Tạo {selectedIndexes.length} công việc</Button></>}><div className="plan-breakdown-flow">
    {step === 'edit' ? <>
      <p className="plan-breakdown-intro">Mỗi dòng là một công việc. Các công việc chỉ được tạo sau khi bạn xem và xác nhận lịch phân bố.</p>
      <Textarea label="Danh sách công việc" value={lines} onChange={(event) => { setLines(event.target.value); setStep('edit') }} placeholder={'Ôn chương 1\nÔn chương 2\nLàm bài tập chương 2\nLàm đề thử'} rows={7} />
      <Select label="Thời gian mỗi việc" customMenu value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(event.target.value)}>{[15, 25, 30, 45, 60, 90].map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}</Select>
      <fieldset className="plan-breakdown-distribution"><legend>Phân bố</legend><div>{(Object.keys(distributionLabels) as Distribution[]).map((item) => <button key={item} type="button" className={distribution === item ? 'active' : ''} onClick={() => setDistribution(item)} aria-pressed={distribution === item}>{distributionLabels[item]}</button>)}</div></fieldset>
      <p className="plan-breakdown-date-note"><CalendarDays size={15} /> Bắt đầu từ {formatTaskDate(dateKey(startDate))}{endDate ? ` · Kết thúc kế hoạch ${formatTaskDate(dateKey(endDate))}` : ''}</p>
    </> : <>
      <div className="plan-breakdown-preview-heading"><div><h3>Xem trước công việc</h3><p>Mỗi ô tích là một công việc sẽ được tạo.</p></div><span>{selectedIndexes.length}/{preview.length}</span></div>
      {exceedsDeadline && <p className="plan-breakdown-warning">Một số công việc vượt quá ngày kết thúc kế hoạch. Bạn vẫn có thể tạo hoặc quay lại để điều chỉnh.</p>}
      <div className="plan-breakdown-preview">{preview.map((item, index) => <label key={`${item.title}-${index}`} className={selectedIndexes.includes(index) ? 'selected' : ''}><input type="checkbox" checked={selectedIndexes.includes(index)} onChange={() => toggleTask(index)} /><span><strong>{item.title}</strong><small>{formatTaskDate(item.date)} · {estimatedMinutes} phút</small></span></label>)}</div>
    </>}
  </div></Modal>
}
