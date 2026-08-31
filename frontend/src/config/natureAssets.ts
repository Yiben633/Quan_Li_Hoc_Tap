const natureBasePath = '/assets/nature'
const natureAssetExtension = '.webp'

const mascotFrame = (animal: NatureMascotAnimal, frame: number) =>
  `${natureBasePath}/mascots/${animal}/frame-${frame}${natureAssetExtension}`

const floraFrame = (name: 'bush', frame: number) =>
  `${natureBasePath}/flora/${name}/frame-${frame}${natureAssetExtension}`

export type NatureMascotAnimal = 'bunny' | 'fox' | 'bear' | 'owl'
export type NatureAssetFrameSet = readonly [string, string, string, string]

export const natureAssets = {
  brand: {
    logoMark: `${natureBasePath}/brand/logo-mark${natureAssetExtension}`,
    logoFull: `${natureBasePath}/brand/logo-full${natureAssetExtension}`,
  },
  mascots: {
    bunny: [mascotFrame('bunny', 1), mascotFrame('bunny', 2), mascotFrame('bunny', 3), mascotFrame('bunny', 4)],
    fox: [mascotFrame('fox', 1), mascotFrame('fox', 2), mascotFrame('fox', 3), mascotFrame('fox', 4)],
    bear: [mascotFrame('bear', 1), mascotFrame('bear', 2), mascotFrame('bear', 3), mascotFrame('bear', 4)],
    owl: [mascotFrame('owl', 1), mascotFrame('owl', 2), mascotFrame('owl', 3), mascotFrame('owl', 4)],
  },
  flora: {
    bush: [floraFrame('bush', 1), floraFrame('bush', 2), floraFrame('bush', 3), floraFrame('bush', 4)],
  },
  effects: {
    cloud01: `${natureBasePath}/effects/cloud-01${natureAssetExtension}`,
  },
  icons: {},
} as const satisfies {
  brand: {
    logoMark: string
    logoFull: string
  }
  mascots: Record<NatureMascotAnimal, NatureAssetFrameSet>
  flora: {
    bush: NatureAssetFrameSet
  }
  effects: Record<string, string | NatureAssetFrameSet>
  icons: Record<string, string>
}

export const natureEmptyStateAssets = {
  tasks: natureAssets.mascots.bunny[0],
  plan: natureAssets.mascots.fox[0],
  calendar: {
    cloud: natureAssets.effects.cloud01,
    bush: natureAssets.flora.bush[0],
  },
  ai: natureAssets.mascots.owl[0],
  focus: natureAssets.mascots.bear[0],
  subject: natureAssets.mascots.fox[0],
  admin: null,
} as const
