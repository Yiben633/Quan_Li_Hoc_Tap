import { create } from 'zustand'
import type { AuthUser } from '../types/auth'

type AuthState = { accessToken: string | null; csrfToken: string | null; user: AuthUser | null; roles: string[]; isAuthenticated: boolean; setSession: (accessToken: string, user?: AuthUser, remember?: boolean, csrfToken?: string) => void; setCsrfToken: (csrfToken: string | null) => void; setUser: (user: AuthUser) => void; clearSession: () => void }
const tokenKey = 'studyflow_access_token'
const userKey = 'studyflow_user'
const csrfKey = 'studyflow_csrf_token'
const readToken = () => localStorage.getItem(tokenKey) ?? sessionStorage.getItem(tokenKey)
const readUser = (): AuthUser | null => { try { const raw = localStorage.getItem(userKey) ?? sessionStorage.getItem(userKey); return raw ? JSON.parse(raw) as AuthUser : null } catch { return null } }
const readCsrfToken = () => localStorage.getItem(csrfKey) ?? sessionStorage.getItem(csrfKey)
const initialUser = readUser()

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: readToken(), csrfToken: readCsrfToken(), user: initialUser, roles: initialUser?.roles ?? [], isAuthenticated: Boolean(readToken()),
  setSession: (accessToken, user, remember = true, csrfToken) => { const storage = remember ? localStorage : sessionStorage; const other = remember ? sessionStorage : localStorage; storage.setItem(tokenKey, accessToken); other.removeItem(tokenKey); if (csrfToken) { storage.setItem(csrfKey, csrfToken); other.removeItem(csrfKey) } if (user) { storage.setItem(userKey, JSON.stringify(user)); other.removeItem(userKey) } set((state) => ({ accessToken, csrfToken: csrfToken ?? state.csrfToken, user: user ?? state.user, roles: user?.roles ?? state.roles, isAuthenticated: true })) },
  setCsrfToken: (csrfToken) => { const storage = localStorage.getItem(tokenKey) ? localStorage : sessionStorage; if (csrfToken) storage.setItem(csrfKey, csrfToken); else storage.removeItem(csrfKey); set({ csrfToken }) },
  setUser: (user) => { const storage = localStorage.getItem(tokenKey) ? localStorage : sessionStorage; storage.setItem(userKey, JSON.stringify(user)); set({ user, roles: user.roles, isAuthenticated: true }) },
  clearSession: () => { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); localStorage.removeItem(csrfKey); sessionStorage.removeItem(tokenKey); sessionStorage.removeItem(userKey); sessionStorage.removeItem(csrfKey); set({ accessToken: null, csrfToken: null, user: null, roles: [], isAuthenticated: false }) },
}))
