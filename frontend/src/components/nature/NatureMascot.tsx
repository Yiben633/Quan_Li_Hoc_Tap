import { natureAssets, type NatureMascotAnimal } from '../../config/natureAssets'

export type NatureMotion =
  | 'none'
  | 'float'
  | 'breathe'
  | 'study'
  | 'focus'
  | 'observe'
  | 'peek'
  | 'perch'

export type NatureMascotSize = 'sm' | 'md' | 'lg' | 'xl' | number

type NatureMascotBaseProps = {
  animal: NatureMascotAnimal
  className?: string
  motion?: NatureMotion
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

const sizeMap: Record<Exclude<NatureMascotSize, number>, number> = {
  sm: 56,
  md: 88,
  lg: 128,
  xl: 180,
}

export function NatureMascot({
  animal,
  alt = '',
  className = '',
  decorative = true,
  motion,
  priority = false,
  size = 'md',
}: NatureMascotProps) {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size]
  const resolvedMotion = motion ?? 'none'
  const mascotClassName = [
    'nature-mascot',
    'nature-mascot-soft',
    `nature-mascot-${typeof size === 'number' ? 'custom' : size}`,
    `nature-mascot-motion-${resolvedMotion}`,
    resolvedMotion !== 'none' && 'nature-motion',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      aria-hidden={decorative || undefined}
      className={mascotClassName}
      data-animal={animal}
      data-motion={resolvedMotion}
      style={{ height: pixelSize, width: pixelSize }}
    >
      <img
        alt={decorative ? '' : alt}
        decoding="async"
        draggable={false}
        fetchPriority={priority ? 'high' : undefined}
        height={pixelSize}
        loading={priority ? 'eager' : 'lazy'}
        src={natureAssets.mascots[animal]}
        width={pixelSize}
      />
    </span>
  )
}
