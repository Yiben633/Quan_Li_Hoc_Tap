import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Download, FileSpreadsheet, FileText, Flag, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, ChartLegend, EmptyState, Modal, ProgressBar, Select, Skeleton } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useGoalsQuery } from '../features/goals/goals.hooks'
import { useLearningSpacesQuery, useTopicsQuery } from '../features/learning/learning.hooks'
import type { ExportFormat, ReportData, ReportFilters, ReportRange } from '../features/reports/reports.api'
import { useReportExportMutation, useReportQuery } from '../features/reports/reports.hooks'

const timeZone = 'Asia/Ho_Chi_Minh'
const rangeLabels: Record<ReportRange, string> = { weekly: '7 ngày gần đây', monthly: '30 ngày gần đây' }

function dateKey(value: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${read('year')}-${read('month')}-${read('day')}`
}

function dayLabel(key: string) {
  return new Intl.DateTimeFormat('vi-VN', { timeZone, day: '2-digit', month: '2-digit' }).format(new Date(`${key}T12:00:00+07:00`))
}

function reportChartData(report?: ReportData) {
  if (!report) return []
  const points = new Map<string, { date: string; label: string; minutes: number; tasks: number }>()
  const point = (value: string) => {
    const key = dateKey(value)
    const current = points.get(key) ?? { date: key, label: dayLabel(key), minutes: 0, tasks: 0 }
    points.set(key, current)
    return current
  }
  report.sessions.forEach((session) => { point(session.startedAt).minutes += session.totalMinutes })
  report.tasks.forEach((task) => { if (task.completedAt) point(task.completedAt).tasks += 1 })
  return [...points.values()].sort((left, right) => left.date.localeCompare(right.date))
}

function formatRange(report: ReportData) {
  const formatter = new Intl.DateTimeFormat('vi-VN', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${formatter.format(new Date(report.start))} - ${formatter.format(new Date(report.end))}`
}

function ExportReportModal({ open, filters, onClose }: { open: boolean; filters: ReportFilters; onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const mutation = useReportExportMutation()
  const submit = () => {
    setStatus('idle')
    mutation.mutate({ ...filters, format }, {
      onSuccess: ({ blob, fileName }) => {
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = fileName
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
        setStatus('success')
        toast.success('Báo cáo đã được tải xuống')
      },
      onError: (error) => { setStatus('error'); toast.error(getApiErrorMessage(error, 'Không thể xuất báo cáo')) },
    })
  }
  return <Modal open={open} title="Xuất báo cáo" onClose={() => !mutation.isPending && onClose()} footer={<><Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Đóng</Button><Button onClick={submit} loading={mutation.isPending}><Download size={16} /> Tạo và tải file</Button></>}>
    <div className="report-export-body"><p>Chọn định dạng mà backend hiện hỗ trợ. Báo cáo sẽ áp dụng khoảng thời gian và bộ lọc đang chọn.</p><div className="report-format-options" role="radiogroup" aria-label="Định dạng báo cáo"><button type="button" role="radio" aria-checked={format === 'pdf'} className={format === 'pdf' ? 'active' : ''} onClick={() => { setFormat('pdf'); setStatus('idle') }}><FileText size={22} /><span><strong>PDF</strong><small>Dễ xem và chia sẻ</small></span></button><button type="button" role="radio" aria-checked={format === 'excel'} className={format === 'excel' ? 'active' : ''} onClick={() => { setFormat('excel'); setStatus('idle') }}><FileSpreadsheet size={22} /><span><strong>Excel</strong><small>Phù hợp phân tích thêm</small></span></button></div>{mutation.isPending && <p className="report-export-status loading">Đang tạo file, vui lòng chờ...</p>}{status === 'success' && <p className="report-export-status success">Đã tạo và tải báo cáo thành công.</p>}{status === 'error' && <p className="report-export-status error">Tạo báo cáo thất bại. Bạn có thể thử lại.</p>}</div>
  </Modal>
}

export function StatisticsPage() {
  const [range, setRange] = useState<ReportRange>('weekly')
  const [semesterId, setSemesterId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const spaces = useLearningSpacesQuery()
  const topics = useTopicsQuery(semesterId ? { semesterId } : undefined)
  const goals = useGoalsQuery({ status: 'in_progress' })
  const filters = useMemo<ReportFilters>(() => ({ range, ...(semesterId ? { semesterId } : {}), ...(subjectId ? { subjectId } : {}) }), [range, semesterId, subjectId])
  const report = useReportQuery(filters)
  const chartData = useMemo(() => reportChartData(report.data), [report.data])
  const activeGoals = goals.data ?? []
  const goalProgress = activeGoals.length ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / activeGoals.length) : 0

  return <div className="statistics-page">
    <div className="page-heading statistics-heading"><div><p className="eyebrow">NHÌN LẠI TIẾN ĐỘ</p><h1>Thống kê</h1><p className="subtle">Số liệu được tổng hợp từ công việc, phiên tập trung và mục tiêu của bạn.</p></div><Button onClick={() => setExportOpen(true)} disabled={!report.data}><Download size={17} /> Xuất báo cáo</Button></div>
    <section className="statistics-toolbar panel" aria-label="Bộ lọc thống kê"><Select customMenu aria-label="Khoảng thời gian thống kê" value={range} onChange={(event) => setRange(event.target.value as ReportRange)}><option value="weekly">7 ngày gần đây</option><option value="monthly">30 ngày gần đây</option></Select><Select customMenu aria-label="Lọc theo không gian học" value={semesterId} onChange={(event) => { setSemesterId(event.target.value); setSubjectId('') }}><option value="">Mọi không gian học</option>{spaces.data?.items.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</Select><Select customMenu aria-label="Lọc theo môn học" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Mọi môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select>{report.data && <span className="statistics-range">{formatRange(report.data)}</span>}</section>
    {report.isLoading ? <><div className="statistics-summary">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={116} />)}</div><Skeleton height={330} /></> : report.isError ? <EmptyState icon={<AlertTriangle size={24} />} title="Chưa thể tải thống kê" description="Kiểm tra kết nối rồi thử lại nhé." action={<Button onClick={() => report.refetch()}>Thử lại</Button>} /> : report.data && <>
      <section className="statistics-summary"><article><span className="statistics-icon green"><CheckCircle2 size={19} /></span><div><small>Việc hoàn thành</small><strong>{report.data.taskDone}</strong><p>{rangeLabels[range]}</p></div></article><article><span className="statistics-icon orange"><AlertTriangle size={19} /></span><div><small>Việc quá hạn</small><strong>{report.data.overdueTasks}</strong><p>Chưa hoàn thành</p></div></article><article><span className="statistics-icon blue"><Clock3 size={19} /></span><div><small>Thời gian tập trung</small><strong>{report.data.totalStudyHours.toLocaleString('vi-VN')}h</strong><p>{report.data.sessions.length} phiên</p></div></article><article><span className="statistics-icon violet"><Target size={19} /></span><div><small>Tiến độ mục tiêu</small><strong>{activeGoals.length ? `${goalProgress}%` : '—'}</strong><p>{activeGoals.length} mục tiêu đang theo dõi</p></div></article></section>
      <section className="statistics-grid"><article className="panel statistics-chart-panel"><div className="panel-heading"><div><h2>Nhịp học theo ngày</h2><p className="subtle">Phút tập trung và số việc hoàn thành, theo giờ Việt Nam.</p></div><BarChart3 size={19} className="panel-icon" /></div>{chartData.length ? <><ChartLegend items={[{ label: 'Phút tập trung', tone: 'primary' }, { label: 'Việc hoàn thành', tone: 'success' }]} /><div className="statistics-chart"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis yAxisId="minutes" tickLine={false} axisLine={false} allowDecimals={false} /><YAxis yAxisId="tasks" orientation="right" tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 7 }} formatter={(value: number, name: string) => name === 'Phút tập trung' ? [`${value} phút`, name] : [value, name]} /><Bar yAxisId="minutes" dataKey="minutes" name="Phút tập trung" fill="var(--blue)" radius={[5, 5, 0, 0]} /><Line yAxisId="tasks" type="monotone" dataKey="tasks" name="Việc hoàn thành" stroke="var(--green)" strokeWidth={2.5} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer></div></> : <EmptyState icon={<BarChart3 size={23} />} title="Chưa có hoạt động trong khoảng này" description="Biểu đồ sẽ xuất hiện khi có phiên tập trung hoặc công việc hoàn thành." />}</article>
      <article className="panel statistics-goals"><div className="panel-heading"><div><h2>Mục tiêu đang theo dõi</h2><p className="subtle">Tiến độ do backend tính từ dữ liệu thực tế.</p></div><Flag size={19} className="panel-icon" /></div>{goals.isLoading ? <div className="statistics-goal-list"><Skeleton height={54} /><Skeleton height={54} /></div> : goals.isError ? <p className="statistics-inline-error">Chưa thể tải tiến độ mục tiêu.</p> : activeGoals.length ? <div className="statistics-goal-list">{activeGoals.slice(0, 5).map((goal) => <div key={goal.id}><div><strong>{goal.name}</strong><span>{goal.currentValue.toLocaleString('vi-VN')} / {goal.targetValue.toLocaleString('vi-VN')}</span></div><ProgressBar value={goal.progressPercent} tone={goal.progressPercent >= 100 ? 'green' : 'blue'} /></div>)}</div> : <EmptyState icon={<Target size={22} />} title="Chưa có mục tiêu đang theo dõi" description="Khi có mục tiêu active, tiến độ sẽ xuất hiện ở đây." />}</article></section>
    </>}
    <ExportReportModal open={exportOpen} filters={filters} onClose={() => setExportOpen(false)} />
  </div>
}
