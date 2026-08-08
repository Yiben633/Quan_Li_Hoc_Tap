import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PomodoroSettings = {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  notificationEnabled: boolean
  soundEnabled: boolean
}

type StudyTimerStore = {
  pomodoro: PomodoroSettings
  updatePomodoro: (values: Partial<PomodoroSettings>) => void
}

const defaults: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  notificationEnabled: false,
  soundEnabled: false,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export const useStudyTimerStore = create<StudyTimerStore>()(persist((set) => ({
  pomodoro: defaults,
  updatePomodoro: (values) => set((current) => ({
    pomodoro: {
      ...current.pomodoro,
      ...values,
      ...(values.focusMinutes !== undefined ? { focusMinutes: clamp(values.focusMinutes, 5, 120) } : {}),
      ...(values.shortBreakMinutes !== undefined ? { shortBreakMinutes: clamp(values.shortBreakMinutes, 1, 60) } : {}),
      ...(values.longBreakMinutes !== undefined ? { longBreakMinutes: clamp(values.longBreakMinutes, 5, 90) } : {}),
    },
  })),
}), { name: 'studyflow-timer-ui' }))
