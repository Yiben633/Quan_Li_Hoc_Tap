import type { CSSProperties } from 'react'
import { natureAssets } from '../../config/natureAssets'

export type NatureFloraName = keyof typeof natureAssets.flora

type NatureFloraProps = {
  className?: string
  height: number
  name: NatureFloraName
  priority?: boolean
  width: number
}

export function NatureFlora({
  className = '',
  height,
  name,
  priority = false,
  width,
}: NatureFloraProps) {
  const style = {
    '--nature-flora-height': `${height}px`,
    '--nature-flora-width': `${width}px`,
    aspectRatio: `${width} / ${height}`,
  } as CSSProperties

  return (
    <span
      aria-hidden="true"
      className={['nature-flora', className].filter(Boolean).join(' ')}
      data-flora={name}
      style={style}
    >
      <img
        alt=""
        decoding="async"
        draggable={false}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        src={natureAssets.flora[name]}
        width={width}
      />
    </span>
  )
}
