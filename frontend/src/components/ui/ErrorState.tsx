import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'

type ErrorStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  compact?: boolean
  className?: string
}

export function ErrorState({
  title = 'Không thể tải dữ liệu.',
  description = 'Thử lại sau một chút.',
  action,
  compact = false,
  className,
}: ErrorStateProps) {
  return <EmptyState
    variant="error"
    compact={compact}
    className={className}
    role="alert"
    icon={<TriangleAlert className="error-state-icon" size={20} aria-hidden="true" />}
    title={title}
    description={description}
    action={action}
  />
}
