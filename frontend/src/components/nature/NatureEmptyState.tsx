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
  sm: 72,
  md: 104,
  lg: 132,
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
  const mascotContent = typeof mascot === 'string'
    ? <NatureMascot animal={mascotAnimals[mascot]} size={mascotSizes[size]} />
    : mascot
  const actions = action || secondaryAction
    ? <div className="nature-empty-state-actions">{action}{secondaryAction}</div>
    : undefined

  return <EmptyState
    className={['nature-empty-state', `nature-empty-state-${size}`, className].filter(Boolean).join(' ')}
    icon={mascotContent}
    title={title}
    description={description}
    action={actions}
  />
}
