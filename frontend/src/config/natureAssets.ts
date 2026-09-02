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
  bunny: `${natureBasePath}/mascots/bunny${natureAssetExtension}`,
  fox: `${natureBasePath}/mascots/fox${natureAssetExtension}`,
  bear: `${natureBasePath}/mascots/bear${natureAssetExtension}`,
  owl: `${natureBasePath}/mascots/owl${natureAssetExtension}`,
  deer: `${natureBasePath}/mascots/deer.png`,
  squirrel: `${natureBasePath}/mascots/squirrel${natureAssetExtension}`,
  hedgehog: `${natureBasePath}/mascots/hedgehog.png`,
  robin: `${natureBasePath}/mascots/robin.png`,
  raccoon: `${natureBasePath}/mascots/raccoon.png`,
  frog: `${natureBasePath}/mascots/frog${natureAssetExtension}`,
}

export const natureAssets = {
  brand: {
    logoMark: `${natureBasePath}/brand/logo-mark${natureAssetExtension}`,
    logoFull: `${natureBasePath}/brand/logo-full${natureAssetExtension}`,
  },
  mascots: existingMascotAssets,
  flora: {
    bush: `${natureBasePath}/flora/bush/bush${natureAssetExtension}`,
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
