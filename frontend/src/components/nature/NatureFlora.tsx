import type { CSSProperties } from 'react'
import { natureAssets } from '../../config/natureAssets'
import { NATURE_IDLE_FRAME_DURATION_MS, type NatureMascotAnimation, useNatureFrameSequence } from './NatureMascot'

export type NatureFloraName = keyof typeof natureAssets.flora

type NatureFloraProps = {
  className?: string
  frameDurationMs?: number
  height: number
  name: NatureFloraName
  priority?: boolean
  width: number
  animation?: NatureMascotAnimation
}

export function NatureFlora({
  animation = 'idle',
  className = '',
  frameDurationMs = NATURE_IDLE_FRAME_DURATION_MS,
  height,
  name,
  priority = false,
  width,
}: NatureFloraProps) {
  const frames = natureAssets.flora[name]
  const [rootRef, frameIndex] = useNatureFrameSequence<HTMLSpanElement>(frames, animation, frameDurationMs)
  const style = {
    '--nature-flora-height': `${height}px`,
    '--nature-flora-width': `${width}px`,
    aspectRatio: `${width} / ${height}`,
  } as CSSProperties

  return <span
    ref={rootRef}
    className={['nature-flora', className].filter(Boolean).join(' ')}
    data-flora={name}
    data-animation={animation}
    style={style}
    aria-hidden="true"
  >
    <img
      src={frames[frameIndex]}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      alt=""
    />
  </span>
}
