import { BarChart3, CheckCircle2, Clock3, TriangleAlert } from 'lucide-react'
import type { CoachChatResponse } from '../aiCoach.types'

type AnalyticsSummaryCardProps = {
  analytics: NonNullable<CoachChatResponse['analytics']>
}

function formatStudyMinutes(value: number) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  if (hours > 0) return `${hours} giờ${minutes > 0 ? ` ${minutes} phút` : ''}`
  return `${minutes} phút`
}

export function AnalyticsSummaryCard({ analytics }: AnalyticsSummaryCardProps) {
  const topSubject = analytics.subjectBreakdown[0]

  return (
    <section className="ai-coach-analytics-card" aria-label="Thống kê học tập tuần này">
      <header>
        <span className="ai-coach-analytics-icon" aria-hidden="true"><BarChart3 size={18} /></span>
        <div>
          <p>SỐ LIỆU TUẦN NÀY</p>
          <h3>Nhìn lại nhịp học</h3>
        </div>
      </header>
      <div className="ai-coach-analytics-grid">
        <article>
          <Clock3 size={16} aria-hidden="true" />
          <span>Thời gian tập trung</span>
          <strong>{formatStudyMinutes(analytics.studyMinutes)}</strong>
        </article>
        <article>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Công việc hoàn thành</span>
          <strong>{analytics.completedTasks}/{analytics.totalTasks}</strong>
        </article>
        <article className={analytics.overdueTasks > 0 ? 'has-warning' : ''}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>Việc quá hạn</span>
          <strong>{analytics.overdueTasks}</strong>
        </article>
      </div>
      {topSubject && (
        <div className="ai-coach-analytics-focus">
          <span>{topSubject.name}</span>
          <strong>{topSubject.percent}% thời gian tập trung</strong>
        </div>
      )}
      <small>Số liệu được tổng hợp trực tiếp từ StudyFlow.</small>
    </section>
  )
}
