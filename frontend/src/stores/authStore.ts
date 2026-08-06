import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

type AuthState = { accessToken: string | null; user: AuthUser | null; setSession: (accessToken: string, user?: AuthUser) => void; clearSession: () => void }

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('studyflow_access_token'),
  user: null,
  setSession: (accessToken, user) => { localStorage.setItem('studyflow_access_token', accessToken); set({ accessToken, user: user ?? null }) },
  clearSession: () => { localStorage.removeItem('studyflow_access_token'); set({ accessToken: null, user: null }) },
}))
