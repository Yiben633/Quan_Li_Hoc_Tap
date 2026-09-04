const natureBasePath = '/assets/nature'
export type NatureMascotAnimal =
  | 'fox'
  | 'bunny'
  | 'bear'
  | 'owl'
  | 'deer'
  | 'squirrel'
  | 'hedgehog'
  | 'robin'
  | 'raccoon'
  | 'frog'

export const natureAssets = {
  brand: {
    logoMark: `${natureBasePath}/brand/logo-mark.webp`,
    logoFull: `${natureBasePath}/brand/logo-full.webp`,
  },
  mascots: {
    fox: `${natureBasePath}/mascots/fox.png`,
    owl: `${natureBasePath}/mascots/owl.png`,
    bunny: `${natureBasePath}/mascots/bunny.png`,
    bear: `${natureBasePath}/mascots/bear.png`,
    deer: `${natureBasePath}/mascots/deer.png`,
    squirrel: `${natureBasePath}/mascots/squirrel.png`,
    raccoon: `${natureBasePath}/mascots/raccoon.png`,
    hedgehog: `${natureBasePath}/mascots/hedgehog.png`,
    frog: `${natureBasePath}/mascots/frog.png`,
    robin: `${natureBasePath}/mascots/robin.png`,
  },
  flora: {
    bush: `${natureBasePath}/flora/bush/bush.webp`,
  },
  effects: {
    cloud01: `${natureBasePath}/effects/cloud-01.webp`,
    leaf01: `${natureBasePath}/leaves/leaf_01.png`,
    leaf02: `${natureBasePath}/leaves/leaf_02.png`,
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
  subject: natureAssets.mascots.fox,
  admin: null,
} as const
