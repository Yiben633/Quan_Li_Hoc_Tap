import { ArrowRight, CalendarDays, Clock3, Edit3, Flag, MoreHorizontal, Pause, Trash2 } from 'lucide-react'
import { Card, Dropdown, Tooltip } from '../../../components/ui'
import { formatTaskDate, formatTaskDeadline } from '../../../utils/taskDate'
import { getPlanHealth } from '../../../utils/planHealth'
import { natureAssets } from '../../../config/natureAssets'
import { PLAN_STATUS_LABELS, PRIORITY_LABELS } from '../task.constants'
import type { StudyPlan } from '../tasks.api'

function dateRange(plan: StudyPlan) {
  if (plan.startDate && plan.endDate) return `${formatTaskDate(plan.startDate)} → ${formatTaskDate(plan.endDate)}`
  if (plan.startDate) return `Bắt đầu ${formatTaskDate(plan.startDate)}`
  if (plan.endDate) return `Deadline ${formatTaskDate(plan.endDate)}`
  return null
}

function estimatedHours(value?: number | null) {
  if (!value || value <= 0) return null
  return `${Number.isInteger(value) ? value : value.toLocaleString('vi-VN')}h dự kiến`
}

export function StudyPlanCard({ plan, onView, onEdit, onPause, onDelete }: { plan: StudyPlan; onView: () => void; onEdit: () => void; onPause: () => void; onDelete: () => void }) {
  const taskTotal = plan.taskTotal ?? 0
  const taskDone = plan.taskDone ?? 0
  const range = dateRange(plan)
  const estimate = estimatedHours(plan.estimatedHours)
  const statusLabel = PLAN_STATUS_LABELS[plan.status] ?? plan.status
  const progressPercent = Math.min(100, Math.max(0, plan.progressPercent))
  const subjectLabel = plan.subject?.code || plan.subject?.name
  const health = getPlanHealth(plan.startDate, plan.endDate, progressPercent)

  return <Card as="article" className={`plan-card plan-card-${plan.status}`}>
    <header className="plan-card-head">
      <div className="plan-card-badges">
        <span className={`plan-status plan-${plan.status}`} aria-label={`Trạng thái: ${statusLabel}`}>{statusLabel}</span>
        <span className={`plan-priority plan-priority-${plan.priority}`}><Flag size={12} aria-hidden="true" /> {PRIORITY_LABELS[plan.priority]}</span>
      </div>
      <Dropdown ariaLabel={`Thao tác với ${plan.title}`} label={<><MoreHorizontal size={18} /><span className="sr-only">Thao tác với {plan.title}</span></>} showChevron={false}>
        <button type="button" className="menu-item" onClick={onView}>Xem chi tiết</button>
        <button type="button" className="menu-item" onClick={onEdit}><Edit3 size={15} /> Chỉnh sửa</button>
        {plan.status === 'in_progress' && <button type="button" className="menu-item" onClick={onPause}><Pause size={15} /> Tạm dừng</button>}
        <button type="button" className="menu-item danger-text" onClick={onDelete}><Trash2 size={15} /> Xóa</button>
      </Dropdown>
    </header>
    <div className="plan-card-copy">
      <h2>{plan.title}</h2>
      {(subjectLabel || plan.targetGoal) && <p>{[subjectLabel, plan.targetGoal ? `Mục tiêu ${plan.targetGoal}` : null].filter(Boolean).join(' · ')}</p>}
    </div>
    {(range || plan.endDate) && <p className="plan-card-date"><CalendarDays size={14} /> {range}{plan.endDate && <><span>·</span><strong>{formatTaskDeadline(plan.endDate)}</strong></>}</p>}
    <div className="plan-card-progress"><div className="plan-card-progress-head"><span>Tiến độ</span><strong>{progressPercent}%</strong></div><div className="progress-line" aria-label={`${progressPercent}% tiến độ`}><span style={{ width: `${progressPercent}%` }} /></div></div>
    <p className="plan-card-meta"><span>{taskTotal > 0 ? `${taskDone}/${taskTotal} công việc` : 'Chưa có công việc'}</span>{estimate && <><i>·</i><span><Clock3 size={13} /> {estimate}</span></>}</p>
    <img className="plan-card-flora" src={natureAssets.flora.bush} width={36} height={36} loading="lazy" decoding="async" alt="" aria-hidden="true" />
    <footer className="plan-card-footer">{health ? <Tooltip label="Đánh giá dựa trên thời gian đã trôi qua và tiến độ công việc."><span className={`plan-health plan-health-${health.status}`}>{health.label}</span></Tooltip> : <span />}<button type="button" onClick={onView}>Tiếp tục <ArrowRight size={15} /></button></footer>
  </Card>
}
