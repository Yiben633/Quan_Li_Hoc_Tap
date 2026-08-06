import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Check, GraduationCap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, Input } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useLoginMutation } from '../features/auth/auth.hooks'
import { loginSchema, type LoginValues } from '../features/auth/auth.schemas'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const mutation = useLoginMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onChange', defaultValues: { email: '', password: '', remember: false } })
  if (isAuthenticated) return <Navigate to="/" replace />
  const submit = (values: LoginValues) => mutation.mutate(values, { onSuccess: (result) => { setSession(result.accessToken, result.user, values.remember); const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname; navigate(from && from !== '/login' ? from : '/', { replace: true }) } })
  return <main className="auth-page"><section className="auth-panel"><div className="auth-logo"><span className="brand-mark"><GraduationCap size={20} /></span>StudyFlow</div><div className="auth-copy"><p className="eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p><h1>Học có kế hoạch,<br /><em>tiến bộ có nhịp.</em></h1><p>Gom lịch học, công việc và mục tiêu vào một nơi rõ ràng hơn.</p></div><form className="auth-form" onSubmit={handleSubmit(submit)} noValidate><Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} /><Input label="Mật khẩu" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} /><div className="auth-options"><Checkbox label="Ghi nhớ đăng nhập" {...register('remember')} /><Link to="/forgot-password">Quên mật khẩu?</Link></div>{mutation.isError && <p className="form-api-error" role="alert">{getApiErrorMessage(mutation.error, 'Email hoặc mật khẩu không đúng.')}</p>}<Button className="wide" type="submit" loading={mutation.isPending}>Đăng nhập <ArrowRight size={17} /></Button><div className="divider"><span>hoặc</span></div><Button className="wide google-button" type="button" variant="secondary"><span className="google-mark">G</span> Đăng nhập bằng Google</Button></form><p className="auth-foot">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p></section><aside className="auth-art"><div className="art-card"><span className="art-kicker">HÔM NAY</span><strong>3 việc cần hoàn thành</strong><div className="art-progress"><span style={{ width: '68%' }} /></div><small>68% tiến độ tuần này</small></div><div className="art-note">“Một bước nhỏ mỗi ngày<br />sẽ tạo thành quãng đường dài.”</div></aside></main>
}
