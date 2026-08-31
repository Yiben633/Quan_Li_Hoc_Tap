import { addDays, format } from 'date-fns'
import { AlertTriangle, Bot, CalendarCheck, Check, Clock3, Plus, Send, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'
import { Button, Checkbox, ConfirmDialog, DatePicker, EmptyState, IconButton, Input, Select, Skeleton, Tabs, Textarea } from '../components/ui'
import { aiFeaturesEnabled } from '../config/features'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { ScheduleSuggestion, ScheduleTaskInput } from '../features/ai/ai.api'
import { useAiChatMutation, useRescheduleMutation, useSuggestScheduleMutation, useSummarizeMutation } from '../features/ai/ai.hooks'
import { useCalendarEventMutation } from '../features/calendar/calendar.hooks'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { useTasksQuery } from '../features/tasks/tasks.hooks'

type WorkspaceTab = 'schedule' | 'assistant'
type ScheduleMode = 'suggest' | 'reschedule'
type DraftTask = ScheduleTaskInput & { key: string }
type DraftSlot = { key: string; date: string; startTime: string; endTime: string }
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string }

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function createSlot(dayOffset = 1): DraftSlot {
  return { key: crypto.randomUUID(), date: format(addDays(new Date(), dayOffset), 'yyyy-MM-dd'), startTime: '18:00', endTime: '20:00' }
}

function aiError(error: unknown, fallback: string) {
  const status = (error as { response?: { status?: number } }).response?.status
  if (status === 429) return 'Bạn đã gửi quá nhiều yêu cầu. Hãy chờ một chút rồi thử lại.'
  return getApiErrorMessage(error, fallback)
}

function toIso(slot: DraftSlot, time: string) {
  return new Date(`${slot.date}T${time}:00`).toISOString()
}

function ScheduleWorkspace() {
  const [mode, setMode] = useState<ScheduleMode>('suggest')
  const [subjectId, setSubjectId] = useState('')
  const tasksQuery = useTasksQuery({ subjectId: subjectId || undefined, limit: 100, sort: 'dueDate', order: 'asc' })
  const topics = useTopicsQuery()
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([])
  const [slots, setSlots] = useState<DraftSlot[]>([createSlot()])
  const [manualTitle, setManualTitle] = useState('')
  const [manualMinutes, setManualMinutes] = useState('30')
  const [manualDueDate, setManualDueDate] = useState('')
  const [suggestion, setSuggestion] = useState<ScheduleSuggestion | null>(null)
  const [confirmApply, setConfirmApply] = useState(false)
  const suggest = useSuggestScheduleMutation()
  const reschedule = useRescheduleMutation()
  const events = useCalendarEventMutation()
  const selectedTopic = topics.data?.items.find((topic) => topic.id === subjectId)
  const availableTasks = useMemo(() => tasksQuery.data?.items.filter((task) => task.status !== 'done') ?? [], [tasksQuery.data])
  const pending = suggest.isPending || reschedule.isPending

  const toggleTask = (taskId: string) => {
    const task = availableTasks.find((item) => item.id === taskId)
    if (!task) return
    setSuggestion(null)
    setDraftTasks((current) => current.some((item) => item.id === taskId)
      ? current.filter((item) => item.id !== taskId)
      : [...current, { key: crypto.randomUUID(), id: task.id, title: task.title, estimatedMinutes: task.estimatedMinutes || 30, dueDate: task.dueDate }])
  }

  const addManualTask = () => {
    const minutes = Number(manualMinutes)
    if (!manualTitle.trim() || !Number.isInteger(minutes) || minutes <= 0) {
      toast.error('Nhập tên công việc và thời lượng hợp lệ')
      return
    }
    setDraftTasks((current) => [...current, { key: crypto.randomUUID(), title: manualTitle.trim(), estimatedMinutes: minutes, dueDate: manualDueDate || null }])
    setManualTitle('')
    setManualDueDate('')
    setSuggestion(null)
  }

  const generate = () => {
    if (!draftTasks.length) {
      toast.error('Hãy chọn hoặc thêm ít nhất một công việc')
      return
    }
    const invalidSlot = slots.some((slot) => !slot.date || !slot.startTime || !slot.endTime || new Date(toIso(slot, slot.startTime)) >= new Date(toIso(slot, slot.endTime)))
    if (invalidSlot) {
      toast.error('Khung giờ rảnh chưa hợp lệ')
      return
    }
    const input = {
      tasks: draftTasks.map(({ key: _key, ...task }) => ({ ...task, dueDate: task.dueDate ? new Date(`${task.dueDate}T23:59:59`).toISOString() : null })),
      slots: slots.map((slot) => ({ startAt: toIso(slot, slot.startTime), endAt: toIso(slot, slot.endTime) })),
    }
    const mutation = mode === 'suggest' ? suggest : reschedule
    mutation.mutate(input, {
      onSuccess: (data) => setSuggestion(data),
      onError: (error) => toast.error(aiError(error, 'Không thể tạo lịch gợi ý')),
    })
  }

  const applySchedule = async () => {
    if (!suggestion?.assignments.length) return
    try {
      await Promise.all(suggestion.assignments.map((assignment) => events.create.mutateAsync({
        title: assignment.title,
        startAt: assignment.startAt,
        endAt: assignment.endAt,
        colorHex: selectedTopic?.colorHex ?? '#3867e8',
      })))
      setConfirmApply(false)
      toast.success(`Đã thêm ${suggestion.assignments.length} lịch vào Calendar`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể áp dụng lịch vào Calendar'))
    }
  }

  return <div className="ai-schedule-layout">
    <section className="panel ai-builder">
      <div className="ai-section-heading"><div><h2>Công việc cần sắp xếp</h2><p>Chọn việc hiện có hoặc thêm một việc riêng cho lần lập lịch này.</p></div><Tabs value={mode} onChange={(value) => { setMode(value); setSuggestion(null) }} items={[{ value: 'suggest', label: 'Lập lịch mới' }, { value: 'reschedule', label: 'Sắp xếp lại' }]} /></div>
      <Select customMenu label="Môn học (tùy chọn)" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setDraftTasks([]); setSuggestion(null) }}>
        <option value="">Mọi môn học</option>
        {topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}
      </Select>
      <div className="ai-task-picker" aria-label="Chọn công việc" aria-busy={tasksQuery.isLoading}>
        {tasksQuery.isLoading ? <div className="ai-task-picker-skeletons">{[1, 2, 3, 4].map((item) => <Skeleton key={item} height={19} width={item % 2 ? '82%' : '68%'} />)}</div> : tasksQuery.isError ? <p className="form-api-error">Chưa thể tải danh sách công việc.</p> : availableTasks.length ? availableTasks.slice(0, 12).map((task) => <Checkbox key={task.id} checked={draftTasks.some((item) => item.id === task.id)} onChange={() => toggleTask(task.id)} label={`${task.title}${task.estimatedMinutes ? ` · ${task.estimatedMinutes} phút` : ''}`} />) : <p className="subtle">Không có công việc đang mở trong phạm vi này.</p>}
      </div>
      <div className="ai-manual-task">
        <Input label="Công việc tự nhập" value={manualTitle} onChange={(event) => setManualTitle(event.target.value)} placeholder="Ví dụ: Luyện nghe 30 phút" />
        <Input label="Thời lượng (phút)" type="number" min="1" max="720" value={manualMinutes} onChange={(event) => setManualMinutes(event.target.value)} />
        <DatePicker label="Hạn (tùy chọn)" value={manualDueDate} onChange={(event) => setManualDueDate(event.target.value)} />
        <Button type="button" variant="secondary" onClick={addManualTask}><Plus size={16} /> Thêm</Button>
      </div>
      {draftTasks.length > 0 && <div className="ai-selected-list">{draftTasks.map((task) => <div key={task.key}><span><strong>{task.title}</strong><small>{task.estimatedMinutes} phút</small></span><IconButton label={`Bỏ ${task.title}`} onClick={() => { setDraftTasks((current) => current.filter((item) => item.key !== task.key)); setSuggestion(null) }}><Trash2 size={15} /></IconButton></div>)}</div>}
      <div className="ai-section-heading slots-heading"><div><h2>Khung giờ rảnh</h2><p>Các khoảng thời gian bạn thực sự có thể dành cho việc học.</p></div><Button type="button" variant="ghost" onClick={() => setSlots((current) => [...current, createSlot(current.length + 1)])}><Plus size={15} /> Thêm khung</Button></div>
      <div className="ai-slot-list">{slots.map((slot, index) => <div key={slot.key} className="ai-slot-row"><DatePicker label={`Ngày ${index + 1}`} value={slot.date} onChange={(event) => { setSlots((current) => current.map((item) => item.key === slot.key ? { ...item, date: event.target.value } : item)); setSuggestion(null) }} /><Input label="Bắt đầu" type="time" value={slot.startTime} onChange={(event) => { setSlots((current) => current.map((item) => item.key === slot.key ? { ...item, startTime: event.target.value } : item)); setSuggestion(null) }} /><Input label="Kết thúc" type="time" value={slot.endTime} onChange={(event) => { setSlots((current) => current.map((item) => item.key === slot.key ? { ...item, endTime: event.target.value } : item)); setSuggestion(null) }} /><IconButton label="Xóa khung giờ" disabled={slots.length === 1} onClick={() => { setSlots((current) => current.filter((item) => item.key !== slot.key)); setSuggestion(null) }}><Trash2 size={15} /></IconButton></div>)}</div>
      <Button className="ai-generate-button" onClick={generate} loading={pending}><Sparkles size={17} /> {mode === 'suggest' ? 'Tạo lịch gợi ý' : 'Gợi ý lịch thay thế'}</Button>
    </section>
    <section className="panel ai-preview" aria-live="polite">
      <div className="ai-section-heading"><div><h2>Lịch xem trước</h2><p>Chỉ được thêm vào Calendar sau khi bạn xác nhận.</p></div><CalendarCheck size={20} /></div>
      {!suggestion ? <EmptyState icon={<Clock3 size={23} />} title="Chưa có lịch gợi ý" description="Thêm công việc và khung giờ để tạo bản xem trước." /> : <>
        <div className="ai-capacity"><span><strong>{suggestion.totalAssignedMinutes}</strong> / {suggestion.totalRequestedMinutes} phút đã xếp</span><div><i style={{ width: `${Math.min(100, suggestion.totalRequestedMinutes ? suggestion.totalAssignedMinutes / suggestion.totalRequestedMinutes * 100 : 0)}%` }} /></div></div>
        {suggestion.warnings.length > 0 && <div className="ai-warning" role="alert"><AlertTriangle size={18} /><div><strong>Khung giờ hiện chưa đủ</strong><p>{suggestion.warnings.map((warning) => warning.message).join(' ')}</p></div></div>}
        {suggestion.assignments.length ? <div className="ai-assignment-list">{suggestion.assignments.map((assignment, index) => <article key={`${assignment.title}-${assignment.startAt}`}><span>{index + 1}</span><div><strong>{assignment.title}</strong><time>{dateTimeFormatter.format(new Date(assignment.startAt))} - {new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date(assignment.endAt))}</time></div></article>)}</div> : <EmptyState title="Chưa xếp được công việc nào" description="Thử thêm một khung giờ dài hơn." />}
        {suggestion.assignments.length > 0 && <Button className="wide" onClick={() => setConfirmApply(true)}><Check size={17} /> Xác nhận và thêm vào lịch</Button>}
      </>}
    </section>
    <ConfirmDialog open={confirmApply} title="Thêm lịch đã xem trước?" description={`${suggestion?.assignments.length ?? 0} mục sẽ được tạo thành sự kiện trong Calendar. Bạn vẫn có thể chỉnh sửa từng mục sau đó.`} onCancel={() => setConfirmApply(false)} onConfirm={applySchedule} loading={events.create.isPending} />
  </div>
}

function AssistantWorkspace() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [summaryText, setSummaryText] = useState('')
  const [summary, setSummary] = useState('')
  const [consent, setConsent] = useState(false)
  const chat = useAiChatMutation()
  const summarize = useSummarizeMutation()

  const send = (value = prompt) => {
    const clean = value.trim()
    if (!clean || chat.isPending) return
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: clean }
    setMessages((current) => [...current, userMessage])
    setPrompt('')
    chat.mutate(clean, {
      onSuccess: (data) => setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.response }]),
      onError: (error) => toast.error(aiError(error, 'Trợ lý chưa thể phản hồi')),
    })
  }

  const createSummary = () => {
    if (!summaryText.trim()) return
    if (!consent) {
      toast.error('Bạn cần xác nhận trước khi gửi nội dung')
      return
    }
    summarize.mutate(summaryText.trim(), {
      onSuccess: (data) => setSummary(data.summary),
      onError: (error) => toast.error(aiError(error, 'Không thể tóm tắt nội dung')),
    })
  }

  return <div className="assistant-layout">
    <section className="panel assistant-chat">
      <div className="ai-section-heading"><div><h2>Trợ lý học tập</h2><p>Trao đổi về kỹ năng, mục tiêu và cách chia nhỏ việc cần làm.</p></div><Bot size={20} /></div>
      <div className="assistant-prompts">{['Chia mục tiêu này thành các bước nhỏ', 'Gợi ý cách học một kỹ năng mới', 'Giúp tôi sắp xếp ưu tiên tuần này'].map((item) => <button type="button" key={item} onClick={() => send(item)}>{item}</button>)}</div>
      <div className="assistant-messages" aria-live="polite">{messages.length ? messages.map((message) => <article key={message.id} className={message.role}><strong>{message.role === 'user' ? 'Bạn' : 'Trợ lý'}</strong><p>{message.content}</p></article>) : <EmptyState icon={<Bot size={24} />} title="Bắt đầu một cuộc trao đổi" description="Chọn một gợi ý hoặc nhập điều bạn đang cần làm rõ." />}{chat.isPending && <article className="assistant"><strong>Trợ lý</strong><p>Đang chuẩn bị phản hồi...</p></article>}</div>
      <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); send() }}><Textarea aria-label="Nội dung trao đổi" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Nhập câu hỏi hoặc mục tiêu của bạn..." rows={3} maxLength={20000} /><Button type="submit" disabled={!prompt.trim()} loading={chat.isPending}><Send size={16} /> Gửi</Button></form>
      <p className="ai-privacy-note">Không nhập mật khẩu, mã xác thực hoặc thông tin nhạy cảm vào cuộc trao đổi.</p>
    </section>
    <section className="panel assistant-summary">
      <div className="ai-section-heading"><div><h2>Tóm tắt nội dung</h2><p>Nội dung chỉ được gửi sau khi bạn xác nhận.</p></div><Sparkles size={20} /></div>
      <Textarea label="Nội dung cần tóm tắt" value={summaryText} onChange={(event) => { setSummaryText(event.target.value); setSummary('') }} rows={9} placeholder="Dán phần nội dung bạn có quyền sử dụng..." maxLength={100000} />
      <Checkbox label="Tôi đồng ý gửi nội dung này tới provider AI đã cấu hình" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
      <Button onClick={createSummary} disabled={!summaryText.trim() || !consent} loading={summarize.isPending}>Tạo bản tóm tắt</Button>
      {summary && <div className="assistant-summary-result" aria-live="polite"><strong>Bản tóm tắt</strong><p>{summary}</p></div>}
    </section>
  </div>
}

export function AIWorkspacePage() {
  const [tab, setTab] = useState<WorkspaceTab>('schedule')
  if (!aiFeaturesEnabled) return <Navigate to="/flashcards" replace />
  return <div className="ai-page">
    <div className="page-heading"><div><p className="eyebrow">CÔNG CỤ HỖ TRỢ TÙY CHỌN</p><h1>Lập kế hoạch và trợ lý</h1><p className="subtle">Bạn luôn xem lại và quyết định trước khi dữ liệu được áp dụng.</p></div><Tabs value={tab} onChange={setTab} items={[{ value: 'schedule', label: 'Lịch gợi ý' }, { value: 'assistant', label: 'Trợ lý' }]} /></div>
    {tab === 'schedule' ? <ScheduleWorkspace /> : <AssistantWorkspace />}
  </div>
}
