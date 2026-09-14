import { ArrowUpRight, BookOpen, Edit3, ListChecks, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../../../components/ui'
import type { Topic } from '../learning.api'

type SubjectCardProps = {
  topic: Topic
  onEdit: (topic: Topic) => void
  onDelete: (topic: Topic) => void
}

const statusLabels: Record<Topic['status'], string> = {
  in_progress: 'Đang học',
  completed: 'Hoàn thành',
  dropped: 'Tạm dừng',
  archived: 'Lưu trữ',
}

export function SubjectCard({ topic, onEdit, onDelete }: SubjectCardProps) {
  const progress = topic.taskProgress
  const taskCount = progress?.taskTotal ?? 0
  const progressPercent = progress?.progressPercent ?? 0

  return (
    <Card as="article" className="topic-card" style={{ borderLeftColor: topic.colorHex }}>
      <div className="topic-card-head">
        <span className={`status-label topic-${topic.status}`}>{statusLabels[topic.status]}</span>
        <div className="topic-card-actions">
          <button className="icon-button" aria-label={`Sửa ${topic.name}`} onClick={() => onEdit(topic)}><Edit3 size={15} /></button>
          <button className="icon-button danger-icon" aria-label={`Xóa ${topic.name}`} onClick={() => onDelete(topic)}><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="topic-card-title">
        <span className="topic-card-icon" style={{ color: topic.colorHex, background: `color-mix(in srgb, ${topic.colorHex} 14%, var(--nature-surface-soft))` }} aria-hidden="true"><BookOpen size={18} /></span>
        <div>
          <h2>{topic.name}</h2>
          <p>{topic.code} · {topic.credits} tín chỉ</p>
        </div>
      </div>

      <div className="topic-card-task-count"><ListChecks size={14} aria-hidden="true" /> <span>{taskCount > 0 ? `${taskCount} nhiệm vụ` : 'Chưa có nhiệm vụ'}</span></div>

      {progress ? (
        <div className="topic-card-progress">
          <div className="topic-card-progress-head"><span>Tiến độ công việc</span><strong>{progressPercent}%</strong></div>
          <div className="topic-card-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} aria-label={`Tiến độ công việc ${progressPercent}%`}><span style={{ width: `${progressPercent}%` }} /></div>
        </div>
      ) : <p className="topic-card-progress-empty">Chưa có dữ liệu tiến độ</p>}

      <div className="topic-card-foot">
        <span className="topic-color" style={{ background: topic.colorHex }} aria-hidden="true" />
        <Link className="text-link" to={`/topics/${topic.id}`}>Mở chi tiết <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
    </Card>
  )
}
