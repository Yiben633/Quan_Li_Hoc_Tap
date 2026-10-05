import type { ReactNode } from 'react'

export type SectionHeaderProps = {
  title: string
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  className?: string
}

export function SectionHeader({ title, description, eyebrow, actions, className = '' }: SectionHeaderProps) {
  return (
    <header className={['section-header', className].filter(Boolean).join(' ')}>
      <div className="section-header-copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="section-header-description">{description}</p>}
      </div>
      {actions && <div className="section-header-actions">{actions}</div>}
    </header>
  )
}
