import type { ReactNode } from 'react'

export type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  variant?: 'default' | 'error'
  compact?: boolean
  role?: 'alert' | 'status'
}

export function EmptyState({ icon, title, description, action, className, variant = 'default', compact = false, role }: EmptyStateProps) {
  return <div className={['empty-state', variant === 'error' && 'error-state', compact && 'is-compact', className].filter(Boolean).join(' ')} role={role}>
    {icon && <span className="empty-icon">{icon}</span>}
    <h3>{title}</h3>
    {description && <p className="subtle">{description}</p>}
    {action && <div className="empty-action">{action}</div>}
  </div>
}
