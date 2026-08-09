import toast from 'react-hot-toast'
import type { FormEvent } from 'react'
import { Button, DatePicker, Input, Modal, Select } from '../../../components/ui'
import type { StudyPlan, Task, TaskInput } from '../tasks.api'
import { DIFFICULTY_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '../task.constants'
import { taskFormSchema } from '../taskForm.schema'

const estimatedMinuteOptions = [15, 25, 30, 45, 60, 90]

type TaskFormProps = {
  open: boolean
  title: string
  submitLabel: string
  onClose: () => void
  onSubmit: (input: TaskInput) => void
  loading: boolean
  initial?: Task
  topics: Array<{ id: string; name: string; code: string }>
  plans: StudyPlan[]
}

export function TaskForm({ open, title, submitLabel, onClose, onSubmit, loading, initial, topics, plans }: TaskFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    const parsed = taskFormSchema.safeParse(values)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra lại thông tin công việc')
      return
    }
    onSubmit(parsed.data)
  }

  return <Modal open={open} title={title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="task-form" loading={loading}>{submitLabel}</Button></>}><form id="task-form" className="modal-form" onSubmit={handleSubmit}><Input name="title" label="Tên công việc" defaultValue={initial?.title} required /><Input name="description" label="Mô tả (tùy chọn)" defaultValue={initial?.description ?? ''} /><div className="form-grid"><Select name="subjectId" label="Môn học (tùy chọn)" customMenu defaultValue={initial?.subjectId ?? ''}><option value="">Không gắn môn học</option>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select><Select name="studyPlanId" label="Kế hoạch (tùy chọn)" customMenu defaultValue={initial?.studyPlanId ?? ''}><option value="">Không gắn kế hoạch</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</Select></div><div className="form-grid"><DatePicker name="startDate" label="Ngày bắt đầu" defaultValue={initial?.startDate?.slice(0, 10) ?? ''} /><DatePicker name="dueDate" label="Hạn hoàn thành" defaultValue={initial?.dueDate?.slice(0, 10) ?? ''} /></div><div className="form-grid"><Select name="estimatedMinutes" label="Thời gian dự kiến" customMenu defaultValue={initial?.estimatedMinutes?.toString() ?? ''}><option value="">Chưa ước tính</option>{estimatedMinuteOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} phút</option>)}</Select><Select name="difficulty" label="Độ khó" customMenu defaultValue={initial?.difficulty?.toString() ?? ''}><option value="">Chưa chọn độ khó</option>{Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div><div className="form-grid"><Select name="priority" label="Độ ưu tiên" customMenu defaultValue={initial?.priority ?? 'medium'}>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select name="status" label="Trạng thái" customMenu defaultValue={initial?.status ?? 'todo'}>{Object.entries(TASK_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div></form></Modal>
}
