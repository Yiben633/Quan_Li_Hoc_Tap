import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/authStore'

const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', withCredentials: true, timeout: 10000, headers: { 'Content-Type': 'application/json' } })
let refreshPromise: Promise<string | null> | null = null

function readCookie(name: string) { return document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))?.split('=').slice(1).join('=') }

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (config.data instanceof FormData) delete config.headers['Content-Type']
  if (config.url?.includes('/auth/refresh') || config.url?.includes('/auth/logout')) { const csrfToken = readCookie('csrfToken'); if (csrfToken) config.headers['x-csrf-token'] = decodeURIComponent(csrfToken) }
  return config
})

apiClient.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retry || original.url?.includes('/auth/refresh')) throw error
  original._retry = true
  refreshPromise ??= (async () => { const csrfToken = readCookie('csrfToken'); if (!csrfToken) { useAuthStore.getState().clearSession(); return null } try { const { data } = await apiClient.post<{ data?: { accessToken?: string } }>('/auth/refresh'); const token = data.data?.accessToken ?? null; if (!token) useAuthStore.getState().clearSession(); return token } catch { useAuthStore.getState().clearSession(); return null } })().finally(() => { refreshPromise = null })
  const token = await refreshPromise
  if (!token) { useAuthStore.getState().clearSession(); throw error }
  useAuthStore.getState().setSession(token)
  original.headers.Authorization = `Bearer ${token}`
  return apiClient(original)
})

export default apiClient
