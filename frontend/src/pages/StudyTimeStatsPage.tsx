import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useMemo, useState } from 'react'
import { Button, ChartLegend, ErrorState, Select, Skeleton } from '../components/ui'
import { NatureEmptyState } from '../components/nature'
import { useTopicsQuery } from '../features/learning/learning.hooks'
import { useStudyTimeStatisticsQuery } from '../features/study-sessions/studySessions.hooks'

type Range = 'day' | 'week' | 'month'

const rangeLabels: Record<Range, string> = { day: 'Hôm nay', week: 'Tuần này', month: 'Tháng này' }

export function StudyTimeStatsPage() {
  const [range, setRange] = useState<Range>('week')
  const [subjectId, setSubjectId] = useState('')
  const topics = useTopicsQuery()
  const query = useStudyTimeStatisticsQuery({ range, ...(subjectId ? { subjectId } : {}) })
  const chartData = useMemo(() => {
    const totals = new Map<string, number>()
    query.data?.sessions.forEach((session) => {
      const date = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(session.startedAt))
      totals.set(date, (totals.get(date) ?? 0) + session.totalMinutes)
    })
    return [...totals.entries()].map(([date, minutes]) => ({ date, minutes }))
  }, [query.data])

  return <div className="study-stats-page">
    <div className="page-heading"><div><p className="eyebrow">THỐNG KÊ TẬP TRUNG</p><h1>Thời gian học</h1><p className="subtle">Xem lại thời gian bạn đã ghi nhận theo từng khoảng thời gian.</p></div></div>
    <section className="panel study-stats-toolbar"><Select customMenu aria-label="Khoảng thời gian thống kê" value={range} onChange={(event) => setRange(event.target.value as Range)}>{Object.entries(rangeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Select customMenu aria-label="Lọc thời gian theo môn học" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Tất cả môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select></section>
    {query.isLoading ? <Skeleton height={320} /> : query.isError ? <ErrorState title="Không thể tải thời gian học." action={<Button onClick={() => void query.refetch()}>Thử lại</Button>} /> : !query.data?.sessionCount ? <NatureEmptyState mascot="focus" size="lg" title="Chưa có phiên học trong khoảng này" description="Khi bạn hoàn thành một phiên tập trung, thống kê sẽ xuất hiện ở đây." /> : <><section className="study-stats-summary"><article><span>Tổng thời gian</span><strong>{query.data.totalHours} giờ</strong></article><article><span>Số phiên</span><strong>{query.data.sessionCount}</strong></article><article><span>Trung bình mỗi phiên</span><strong>{Math.round(query.data.totalMinutes / query.data.sessionCount)} phút</strong></article></section><section className="panel study-time-chart"><div><h2>Thời gian đã ghi nhận</h2><p className="subtle">Phút theo ngày trong {rangeLabels[range].toLowerCase()}.</p></div><ChartLegend items={[{ label: 'Thời gian học', tone: 'primary' }]} /><div className="study-time-chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--line)" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip cursor={{ fill: 'var(--blue-soft)' }} formatter={(value: number) => [`${value} phút`, 'Thời gian']} /><Bar dataKey="minutes" name="Thời gian" fill="var(--blue)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section></>}
  </div>
}
