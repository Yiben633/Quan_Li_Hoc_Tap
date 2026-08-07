import { ArrowLeft, BookOpen, CheckSquare, Clock3, Gauge, NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Skeleton, Tabs } from '../components/ui'
import { useTopicQuery } from '../features/learning/learning.hooks'
import { TaskList } from '../features/tasks/components/TaskList'
import { TaskQuickCreate } from '../features/tasks/components/TaskQuickCreate'
import { usePlansQuery, useTaskStatusMutation, useTasksQuery } from '../features/tasks/tasks.hooks'

type DetailTab = 'overview' | 'tasks'
const tabs: Array<{ value: DetailTab; label: React.ReactNode }> = [{ value: 'overview', label: 'Tổng quan' }, { value: 'tasks', label: <><CheckSquare size={14} /> Công việc</> }]

export function TopicDetailPage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<DetailTab>('overview')
  const statusTask = useTaskStatusMutation()
  const client = useQueryClient()
  const query = useTopicQuery(id)
  const tasks = useTasksQuery({ subjectId: id, page: 1, limit: 50, sort: 'sortOrder', order: 'asc' })
  const plans = usePlansQuery({ subjectId: id, limit: '100' })

  if (query.isLoading) return <div className="topic-detail"><Skeleton height={260} /></div>
  if (query.isError || !query.data) return <EmptyState title="Không thể tải chủ đề" description="Chủ đề có thể đã bị xóa hoặc bạn không có quyền truy cập." action={<Link className="button secondary" to="/topics">Quay lại chủ đề</Link>} />

  const topic = query.data
  const taskList = tasks.isLoading ? <Skeleton height={120} /> : tasks.isError ? <EmptyState title="Không thể tải công việc" description="Hãy thử lại sau." /> : tasks.data?.items.length ? <TaskList tasks={tasks.data.items} mode="compact" onStatusChange={(taskId, status) => statusTask.mutate({ id: taskId, status })} /> : <EmptyState title="Chưa có công việc" description="Thêm việc đầu tiên cho chủ đề này." />

  return <div className="topic-detail"><Link className="back-link" to="/topics"><ArrowLeft size={15} /> Quay lại chủ đề</Link><header className="topic-detail-head" style={{ borderLeftColor: topic.colorHex }}><div><p className="eyebrow">{topic.code}</p><h1>{topic.name}</h1><p className="subtle">{topic.credits} đơn vị theo dõi · {topic.status === 'completed' ? 'Đã hoàn thành' : 'Đang theo dõi'}</p></div><span className="topic-detail-mark" style={{ background: topic.colorHex }}><BookOpen size={22} /></span></header><Tabs value={tab} onChange={setTab} items={tabs} />{tab === 'overview' ? <><TaskQuickCreate subjectId={id} plans={plans.data?.items ?? []} onCreated={() => { client.invalidateQueries({ queryKey: ['subject', id] }) }} /><section className="topic-stats"><Stat label="Việc đã tạo" value={topic.statistics.taskTotal} icon={<CheckSquare size={18} />} /><Stat label="Việc hoàn thành" value={topic.statistics.taskDone} icon={<Gauge size={18} />} /><Stat label="Thời gian học" value={`${topic.statistics.totalStudyMinutes} phút`} icon={<Clock3 size={18} />} /><Stat label="Điểm hiện tại" value={topic.statistics.currentAverage ?? '—'} icon={<NotebookPen size={18} />} /></section><section className="panel topic-task-panel"><div className="panel-heading"><div><h2>Công việc gần đây</h2><p className="subtle">Các việc đang theo dõi trong chủ đề này.</p></div></div>{taskList}</section></> : <section className="panel topic-task-panel"><div className="panel-heading"><div><h2>Công việc</h2><p className="subtle">Cập nhật ngay trong chủ đề.</p></div></div><TaskQuickCreate subjectId={id} plans={plans.data?.items ?? []} onCreated={() => { client.invalidateQueries({ queryKey: ['subject', id] }) }} />{taskList}</section>}</div>
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) { return <div className="stat-card topic-stat"><span className="stat-icon blue">{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong></div> }
