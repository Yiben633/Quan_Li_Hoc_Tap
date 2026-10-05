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
    logoMark: `${natureBasePath}/brand/auth-logo-mark.png`,
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
  mascotVariants: {
    bunnyLaptop: `${natureBasePath}/mascots/bunny_laptop.png`,
    foxSleep: `${natureBasePath}/mascots/fox_sleep.png`,
  },
  flora: {
    bush: `${natureBasePath}/flora/bush/bush.webp`,
  },
  leaves: {
    leaf01: `${natureBasePath}/leaves/leaf_01.png`,
    leaf02: `${natureBasePath}/leaves/leaf_02.png`,
    leaf03: `${natureBasePath}/leaves/leaf_03.png`,
    leaf04: `${natureBasePath}/leaves/leaf_04.png`,
    leaf05: `${natureBasePath}/leaves/leaf_05.png`,
  },
  effects: {
    cloud01: `${natureBasePath}/effects/cloud-01.webp`,
    leaf01: `${natureBasePath}/leaves/leaf_01.png`,
    leaf02: `${natureBasePath}/leaves/leaf_02.png`,
  },
  scenes: {
    pastelSunriseLakeValley: `${natureBasePath}/scenes/pastel-sunrise-lake-valley.png`,
    pastelMeadowSignboard: `${natureBasePath}/scenes/pastel-meadow-signboard-border.png`,
    foxReadingLakeside: `${natureBasePath}/scenes/fox-reading-lakeside-meadow.png`,
  },
  decorations: {
    books: `${natureBasePath}/decorations/books.png`,
    calendarCheck: `${natureBasePath}/decorations/calendar_check.png`,
    coffee: `${natureBasePath}/decorations/coffee.png`,
    keepGoingSign: `${natureBasePath}/decorations/keep_going_sign.png`,
    lantern: `${natureBasePath}/decorations/lantern.png`,
    mushroom: `${natureBasePath}/decorations/mushroom.png`,
    openBook: `${natureBasePath}/decorations/open_book.png`,
  },
  icons: {},
} as const satisfies {
  brand: {
    logoMark: string
    logoFull: string
  }
  mascots: Record<NatureMascotAnimal, string>
  mascotVariants: Record<string, string>
  flora: {
    bush: string
  }
  leaves: Record<string, string>
  effects: Record<string, string>
  scenes: {
    pastelSunriseLakeValley: string
    pastelMeadowSignboard: string
    foxReadingLakeside: string
  }
  decorations: Record<string, string>
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

// Stable product-facing aliases for shared UI that should not depend on the
// more detailed nature registry shape.
export const studyflowAssets = {
  animals: {
    bear: natureAssets.mascots.bear,
    bunny: natureAssets.mascots.bunny,
    fox: natureAssets.mascots.fox,
    owl: natureAssets.mascots.owl,
  },
  nature: {
    bush: natureAssets.flora.bush,
    leaf: natureAssets.leaves.leaf01,
    cloud: natureAssets.effects.cloud01,
  },
} as const
