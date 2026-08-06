import apiClient from '../../services/apiClient'
import type { AuthUser } from '../../types/auth'
import type { LoginValues, RegisterValues } from './auth.schemas'
type ApiResponse<T> = { success: boolean; message: string; data: T }
export async function login(input: LoginValues) { const response = await apiClient.post<ApiResponse<{ user: AuthUser; accessToken: string }>>('/auth/login', { email: input.email, password: input.password }); return response.data.data }
export async function register(input: RegisterValues) { const response = await apiClient.post<ApiResponse<AuthUser>>('/auth/register', { fullName: input.fullName, email: input.email, password: input.password }); return response.data.data }
export async function requestOtp(email: string) { const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }); return response.data }
export async function verifyOtp(email: string, otp: string) { const response = await apiClient.post<ApiResponse<null>>('/auth/verify-otp', { email, otp }); return response.data }
export async function resetPassword(email: string, otp: string, newPassword: string) { const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', { email, otp, newPassword }); return response.data }
export function getApiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.') { const typed = error as { code?: string; message?: string; response?: { data?: { message?: string; errors?: Array<{ message?: string } | string> } } }; const response = typed.response?.data; if (!response && (typed.code === 'ERR_NETWORK' || typed.message?.toLowerCase().includes('network'))) return 'Không thể kết nối máy chủ. Hãy kiểm tra backend đang chạy tại cổng 4000.'; const details = response?.errors?.map((item) => typeof item === 'string' ? item : item.message).filter(Boolean).join(', '); return details ? `${response?.message ?? fallback}: ${details}` : response?.message ?? fallback }
