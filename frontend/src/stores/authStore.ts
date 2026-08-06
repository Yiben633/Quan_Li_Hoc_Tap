import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

type AuthState = { accessToken: string | null; user: AuthUser | null; roles: string[]; isAuthenticated: boolean; setSession: (accessToken: string, user?: AuthUser, remember?: boolean) => void; setUser: (user: AuthUser) => void; clearSession: () => void }
const tokenKey = 'studyflow_access_token'
const userKey = 'studyflow_user'
const readToken = () => localStorage.getItem(tokenKey) ?? sessionStorage.getItem(tokenKey)
const readUser = (): AuthUser | null => { try { const raw = localStorage.getItem(userKey) ?? sessionStorage.getItem(userKey); return raw ? JSON.parse(raw) as AuthUser : null } catch { return null } }
const initialUser = readUser()

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readToken(), user: initialUser, roles: initialUser?.roles ?? [], isAuthenticated: Boolean(readToken()),
  setSession: (accessToken, user, remember = true) => { const storage = remember ? localStorage : sessionStorage; const other = remember ? sessionStorage : localStorage; storage.setItem(tokenKey, accessToken); other.removeItem(tokenKey); if (user) { storage.setItem(userKey, JSON.stringify(user)); other.removeItem(userKey) } set({ accessToken, user: user ?? null, roles: user?.roles ?? [], isAuthenticated: true }) },
  setUser: (user) => { const storage = localStorage.getItem(tokenKey) ? localStorage : sessionStorage; storage.setItem(userKey, JSON.stringify(user)); set({ user, roles: user.roles, isAuthenticated: true }) },
  clearSession: () => { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(userKey); set({ accessToken: null, user: null, roles: [], isAuthenticated: false }) },
}))
