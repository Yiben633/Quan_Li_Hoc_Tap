const natureBasePath = '/assets/nature'

const mascotFrame = (animal: NatureMascotAnimal, frame: number) =>
  `${natureBasePath}/mascots/${animal}/frame-${frame}.png`

const floraFrame = (name: 'bush', frame: number) =>
  `${natureBasePath}/flora/${name}/frame-${frame}.png`

export type NatureMascotAnimal = 'bunny' | 'fox' | 'bear' | 'owl'
export type NatureAssetFrameSet = readonly [string, string, string, string]

export const natureAssets = {
  brand: {
    logoMark: `${natureBasePath}/brand/logo-mark.png`,
    logoFull: `${natureBasePath}/brand/logo-full.png`,
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
  effects: {},
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
