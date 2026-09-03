import { natureEmptyStateAssets } from '../../config/natureAssets'

export type NatureEmptyMascotKind = 'tasks' | 'plan' | 'ai' | 'subject'

type NatureEmptyMascotProps = {
  kind: NatureEmptyMascotKind
  size?: number
  className?: string
}

export function NatureEmptyMascot({ kind, size = 104, className }: NatureEmptyMascotProps) {
  return <img
    className={['nature-empty-mascot', className].filter(Boolean).join(' ')}
    src={natureEmptyStateAssets[kind]}
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
    alt=""
    aria-hidden="true"
  />
}
