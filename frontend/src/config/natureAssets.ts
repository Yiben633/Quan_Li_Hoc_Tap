const natureBasePath = '/assets/nature'
const natureAssetExtension = '.webp'

export type NatureMascotAnimal =
  | 'bunny'
  | 'fox'
  | 'bear'
  | 'owl'
  | 'deer'
  | 'squirrel'
  | 'hedgehog'
  | 'robin'
  | 'raccoon'
  | 'frog'

const existingMascotAssets: Record<NatureMascotAnimal, string> = {
  bunny: `${natureBasePath}/mascots/bunny/frame-1${natureAssetExtension}`,
  fox: `${natureBasePath}/mascots/fox/frame-1${natureAssetExtension}`,
  bear: `${natureBasePath}/mascots/bear/frame-1${natureAssetExtension}`,
  owl: `${natureBasePath}/mascots/owl/frame-1${natureAssetExtension}`,
  // These fallbacks keep the registry valid until dedicated static assets are copied.
  deer: `${natureBasePath}/mascots/fox/frame-1${natureAssetExtension}`,
  squirrel: `${natureBasePath}/mascots/bunny/frame-1${natureAssetExtension}`,
  hedgehog: `${natureBasePath}/mascots/bunny/frame-1${natureAssetExtension}`,
  robin: `${natureBasePath}/mascots/owl/frame-1${natureAssetExtension}`,
  raccoon: `${natureBasePath}/mascots/fox/frame-1${natureAssetExtension}`,
  frog: `${natureBasePath}/mascots/bear/frame-1${natureAssetExtension}`,
}

export const natureAssets = {
  brand: {
    logoMark: `${natureBasePath}/brand/logo-mark${natureAssetExtension}`,
    logoFull: `${natureBasePath}/brand/logo-full${natureAssetExtension}`,
  },
  mascots: existingMascotAssets,
  flora: {
    bush: `${natureBasePath}/flora/bush/frame-1${natureAssetExtension}`,
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
  mascots: Record<NatureMascotAnimal, string>
  flora: {
    bush: string
  }
  effects: Record<string, string>
  icons: Record<string, string>
}

export const natureEmptyStateAssets = {
  tasks: natureAssets.mascots.bunny,
  plan: natureAssets.mascots.fox,
  calendar: {
    cloud: natureAssets.effects.cloud01,
    bush: natureAssets.flora.bush,
  },
  ai: natureAssets.mascots.owl,
  focus: natureAssets.mascots.bear,
  subject: natureAssets.mascots.fox,
  admin: null,
} as const
