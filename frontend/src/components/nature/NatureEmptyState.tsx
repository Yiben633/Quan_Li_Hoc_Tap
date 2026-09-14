import type { ReactElement, ReactNode } from 'react'
import { EmptyState } from '../ui/EmptyState'
import type { NatureEmptyMascotKind } from './NatureEmptyMascot'
import { NatureMascot } from './NatureMascot'

export type NatureEmptyStateSize = 'sm' | 'md' | 'lg'

export type NatureEmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  secondaryAction?: ReactNode
  mascot?: NatureEmptyMascotKind | ReactElement
  size?: NatureEmptyStateSize
  className?: string
}

const mascotSizes: Record<NatureEmptyStateSize, number> = {
  sm: 92,
  md: 144,
  lg: 180,
}

const mascotAnimals = {
  ai: 'owl',
  plan: 'fox',
  subject: 'fox',
  tasks: 'bunny',
} as const satisfies Record<NatureEmptyMascotKind, 'bunny' | 'fox' | 'owl'>

export function NatureEmptyState({
  title,
  description,
  action,
  secondaryAction,
  mascot,
  size = 'md',
  className,
}: NatureEmptyStateProps) {
  const resolvedMascot = mascot ?? (size === 'lg' ? 'plan' : undefined)
  const mascotContent = typeof resolvedMascot === 'string'
    ? <NatureMascot animal={mascotAnimals[resolvedMascot]} size={mascotSizes[size]} />
    : resolvedMascot
  const displayTitle = title === 'Chưa có hành trình nào.' ? 'Chưa có kế hoạch nào' : title
  const displayDescription = description === 'Tạo một kế hoạch để bắt đầu.' ? 'Tạo kế hoạch đầu tiên để bắt đầu.' : description
  const actions = action || secondaryAction
    ? <div className="nature-empty-state-actions">{action}{secondaryAction}</div>
    : undefined

  return <EmptyState
    className={['nature-empty-state', `nature-empty-state-${size}`, className].filter(Boolean).join(' ')}
    icon={mascotContent}
    title={displayTitle}
    description={displayDescription}
    action={actions}
  />
}
