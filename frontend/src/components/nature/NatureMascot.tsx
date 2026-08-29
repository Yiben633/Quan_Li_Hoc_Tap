import { useEffect, useMemo, useRef, useState } from 'react'
import { natureAssets, type NatureMascotAnimal } from '../../config/natureAssets'

export type NatureMascotAnimation = 'idle'
export type NatureMascotSize = 'sm' | 'md' | 'lg' | 'xl' | number

type NatureMascotBaseProps = {
  animal: NatureMascotAnimal
  animation?: NatureMascotAnimation
  className?: string
  frameDurationMs?: number
  size?: NatureMascotSize
}

type DecorativeMascotProps = NatureMascotBaseProps & {
  alt?: ''
  decorative?: true
}

type MeaningfulMascotProps = NatureMascotBaseProps & {
  alt: string
  decorative: false
}

export type NatureMascotProps = DecorativeMascotProps | MeaningfulMascotProps

const sizeMap = {
  sm: 72,
  md: 112,
  lg: 160,
  xl: 220,
} satisfies Record<Exclude<NatureMascotSize, number>, number>

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const onVisibilityChange = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return visible
}

function useInViewport<TElement extends Element>() {
  const ref = useRef<TElement | null>(null)
  const [inViewport, setInViewport] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => setInViewport(entry.isIntersecting),
      { rootMargin: '80px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, inViewport] as const
}

export function NatureMascot({
  animal,
  animation = 'idle',
  alt = '',
  className = '',
  decorative = true,
  frameDurationMs = 900,
  size = 'md',
}: NatureMascotProps) {
  const frames = natureAssets.mascots[animal]
  const [frameIndex, setFrameIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const documentVisible = useDocumentVisible()
  const [rootRef, inViewport] = useInViewport<HTMLSpanElement>()
  const pixelSize = typeof size === 'number' ? size : sizeMap[size]
  const shouldAnimate = animation === 'idle' && !reducedMotion && documentVisible && inViewport
  const classNames = ['nature-mascot', `nature-mascot-${typeof size === 'number' ? 'custom' : size}`, className].filter(Boolean).join(' ')

  useEffect(() => {
    frames.forEach((src) => {
      const image = new Image()
      image.src = src
    })
  }, [frames])

  useEffect(() => {
    if (!shouldAnimate) {
      setFrameIndex(0)
      return
    }

    const intervalId = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length)
    }, frameDurationMs)

    return () => window.clearInterval(intervalId)
  }, [frameDurationMs, frames.length, shouldAnimate])

  const accessibilityProps = useMemo(() => {
    if (decorative) return { 'aria-hidden': true, alt: '' }
    return { alt }
  }, [alt, decorative])

  return (
    <span
      ref={rootRef}
      className={classNames}
      data-animal={animal}
      data-animation={animation}
      style={{ width: pixelSize, height: pixelSize }}
    >
      <img
        src={frames[frameIndex]}
        width={pixelSize}
        height={pixelSize}
        loading="lazy"
        decoding="async"
        draggable={false}
        {...accessibilityProps}
      />
    </span>
  )
}
