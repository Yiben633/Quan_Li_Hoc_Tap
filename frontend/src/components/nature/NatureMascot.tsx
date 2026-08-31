import { useEffect, useMemo, useRef, useState } from 'react'
import { natureAssets, type NatureMascotAnimal } from '../../config/natureAssets'
import { useMediaQuery } from '../../hooks/useMediaQuery'

export type NatureMascotAnimation = 'idle' | 'static'
export type NatureMascotSize = 'sm' | 'md' | 'lg' | 'xl' | number

export const NATURE_IDLE_FRAME_DURATION_MS = 900

type NatureMascotBaseProps = {
  animal: NatureMascotAnimal
  animation?: NatureMascotAnimation
  className?: string
  frameDurationMs?: number
  priority?: boolean
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
    if (typeof window.matchMedia !== 'function') return
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

const preloadedFrameUrls = new Set<string>()

function preloadFrames(frames: readonly string[]) {
  frames.forEach((frame) => {
    if (preloadedFrameUrls.has(frame)) return
    preloadedFrameUrls.add(frame)
    const image = new Image()
    image.src = frame
  })
}

function getSynchronizedFrameIndex(frameCount: number, frameDurationMs: number) {
  return Math.floor(Date.now() / frameDurationMs) % frameCount
}

export function useNatureFrameSequence<TElement extends HTMLElement>(
  frames: readonly string[],
  animation: NatureMascotAnimation,
  frameDurationMs: number,
) {
  const [frameIndex, setFrameIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const isMobileViewport = useMediaQuery('(max-width: 639px)')
  const documentVisible = useDocumentVisible()
  const [rootRef, inViewport] = useInViewport<TElement>()
  const normalizedFrameDurationMs = Math.min(1200, Math.max(700, frameDurationMs))
  const shouldAnimate = animation === 'idle' && !reducedMotion && !isMobileViewport && documentVisible && inViewport

  useEffect(() => {
    if (animation === 'idle') preloadFrames(frames)
  }, [animation, frames])

  useEffect(() => {
    if (!shouldAnimate) {
      setFrameIndex(0)
      return
    }

    const updateFrame = () => setFrameIndex(getSynchronizedFrameIndex(frames.length, normalizedFrameDurationMs))
    updateFrame()

    const delay = normalizedFrameDurationMs - (Date.now() % normalizedFrameDurationMs)
    let intervalId: number | undefined
    const timeoutId = window.setTimeout(() => {
      updateFrame()
      intervalId = window.setInterval(updateFrame, normalizedFrameDurationMs)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [frames.length, normalizedFrameDurationMs, shouldAnimate])

  return [rootRef, frameIndex] as const
}

export function NatureMascot({
  animal,
  animation = 'idle',
  alt = '',
  className = '',
  decorative = true,
  frameDurationMs = NATURE_IDLE_FRAME_DURATION_MS,
  priority = false,
  size = 'md',
}: NatureMascotProps) {
  const frames = natureAssets.mascots[animal]
  const [rootRef, frameIndex] = useNatureFrameSequence<HTMLSpanElement>(frames, animation, frameDurationMs)
  const pixelSize = typeof size === 'number' ? size : sizeMap[size]
  const classNames = ['nature-mascot', `nature-mascot-${typeof size === 'number' ? 'custom' : size}`, className].filter(Boolean).join(' ')

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
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        {...accessibilityProps}
      />
    </span>
  )
}
