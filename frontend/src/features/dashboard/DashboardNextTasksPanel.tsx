import { ArrowRight, ArrowUpRight, ListTodo } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { useTasksQuery } from '../tasks/tasks.hooks'
import type { Task } from '../tasks/tasks.api'
import { formatTaskDeadline } from '../../utils/taskDate'
import { getNextTaskScore } from '../../utils/nextTask'

function nextTasks(tasks: Task[]) {
  return tasks
    .filter((task) => task.status !== 'done')
    .sort((left, right) => {
      const scoreDifference = getNextTaskScore(right) - getNextTaskScore(left)
      if (scoreDifference !== 0) return scoreDifference

      const titleDifference = left.title.localeCompare(right.title, 'vi')
      return titleDifference || left.id.localeCompare(right.id)
    })
    .slice(0, 3)
}

export function DashboardNextTasksPanel() {
  const tasksQuery = useTasksQuery({ limit: 100 })
  const tasks = nextTasks(tasksQuery.data?.items ?? [])

  return <section className="panel dashboard-next-tasks-panel" aria-labelledby="dashboard-next-tasks-title">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">VIỆC NÊN LÀM TIẾP</p>
        <h2 id="dashboard-next-tasks-title">Ba bước nên ưu tiên</h2>
      </div>
      <Link className="text-link" to="/tasks">Xem tất cả <ArrowUpRight size={15} /></Link>
    </div>
    {tasksQuery.isLoading ? <div className="dashboard-next-tasks-skeleton"><Skeleton height={66} /><Skeleton height={66} /><Skeleton height={66} /></div> : tasksQuery.isError ? <ErrorState compact title="Không thể tải việc ưu tiên." action={<button className="button secondary" onClick={() => tasksQuery.refetch()}>Thử lại</button>} /> : tasks.length ? <ol className="dashboard-next-tasks-list">
      {tasks.map((task, index) => {
        const metadata = [
          task.subject?.name ?? 'Chưa gắn môn học',
          task.estimatedMinutes !== null && task.estimatedMinutes !== undefined ? `${task.estimatedMinutes} phút` : null,
          `Hạn ${formatTaskDeadline(task.dueDate)}`,
        ].filter(Boolean)

        return <li key={task.id}>
          <Link to={`/tasks?scope=all&taskId=${task.id}`} aria-label={`Mở chi tiết công việc ${task.title}`}>
            <span className="dashboard-next-tasks-number" aria-hidden="true">{index + 1}</span>
            <span className="dashboard-next-tasks-copy"><strong>{task.title}</strong><small>{metadata.join(' · ')}</small></span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </li>
      })}
    </ol> : <EmptyState icon={<ListTodo size={22} />} title="Chưa có việc cần ưu tiên" description="Các công việc chưa hoàn thành sẽ xuất hiện ở đây." />}
  </section>
}
