import type { NatureMotion } from '../components/nature/NatureMascot'
import type { NatureMascotAnimal } from './natureAssets'

export type MascotRoleDefinition = Readonly<{
  animal: NatureMascotAnimal
  motion: NatureMotion
}>

export const mascotRoles = {
  dashboard: { animal: 'fox', motion: 'study' },
  tasks: { animal: 'bunny', motion: 'study' },
  studyPlans: { animal: 'fox', motion: 'study' },
  subject: { animal: 'fox', motion: 'study' },
  goals: { animal: 'deer', motion: 'breathe' },
  notes: { animal: 'hedgehog', motion: 'float' },
  flashcards: { animal: 'hedgehog', motion: 'float' },
  calendar: { animal: 'robin', motion: 'perch' },
  groups: { animal: 'raccoon', motion: 'peek' },
  break: { animal: 'frog', motion: 'breathe' },
  aiCoach: { animal: 'owl', motion: 'observe' },
} as const satisfies Record<string, MascotRoleDefinition>

export type MascotRole = keyof typeof mascotRoles
