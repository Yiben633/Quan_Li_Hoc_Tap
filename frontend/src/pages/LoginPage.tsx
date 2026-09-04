import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ChevronRight, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Checkbox, Input, Modal } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useLoginMutation } from '../features/auth/auth.hooks'
import { loginSchema, type LoginValues } from '../features/auth/auth.schemas'
import { useAuthStore } from '../stores/authStore'
import { natureAssets } from '../config/natureAssets'

type Destination = '/admin' | '/dashboard'

export function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()
  const location = useLocation()
  const mutation = useLoginMutation()
  const pendingAdminChoice = useRef(false)
  const [destinationChooserOpen, setDestinationChooserOpen] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', remember: false },
  })
  const feedback = location.state as { registered?: boolean; resetSuccess?: boolean } | null

  if (isAuthenticated && !pendingAdminChoice.current) return <Navigate to="/dashboard" replace />

  const goToDestination = (destination: Destination) => {
    setDestinationChooserOpen(false)
    navigate(destination, { replace: true })
  }

  const submit = (values: LoginValues) => mutation.mutate(values, {
    onSuccess: (result) => {
      const isAdmin = result.user.roles.includes('admin')
      pendingAdminChoice.current = isAdmin
      setSession(result.accessToken, result.user, values.remember, result.csrfToken)

      if (isAdmin) {
        setDestinationChooserOpen(true)
        return
      }

      navigate('/dashboard', { replace: true })
    },
  })

  return <>
    <main className="auth-page login-page">
      <div className="login-page-decoration" aria-hidden="true">
        <img src={natureAssets.effects.leaf01} alt="" width={84} height={84} loading="lazy" decoding="async" />
        <img src={natureAssets.effects.leaf02} alt="" width={58} height={58} loading="lazy" decoding="async" />
      </div>
      <section className="auth-panel">
        <div className="auth-logo"><img src={natureAssets.brand.logoMark} alt="" width={34} height={34} loading="eager" decoding="async" />StudyFlow</div>
        <div className="auth-copy">
          <p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p>
          <h1>Tiếp tục<br /><em>nhịp học của bạn.</em></h1>
          <p>Mở lại kế hoạch và việc cần làm tiếp theo.</p>
        </div>
        {feedback?.registered && <p className="form-success" role="status">Tài khoản đã tạo. Hãy đăng nhập để bắt đầu.</p>}
        {feedback?.resetSuccess && <p className="form-success" role="status">Mật khẩu đã được đặt lại thành công.</p>}
        <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Mật khẩu" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <div className="auth-options">
            <Checkbox label="Ghi nhớ đăng nhập" {...register('remember')} />
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
          {mutation.isError && <p className="form-api-error" role="alert">{getApiErrorMessage(mutation.error, 'Email hoặc mật khẩu không đúng.')}</p>}
          <Button className="wide" type="submit" loading={mutation.isPending}>Đăng nhập <ArrowRight size={17} /></Button>
          <div className="divider"><span>hoặc</span></div>
          <Button className="wide google-button" type="button" variant="secondary"><span className="google-mark">G</span> Đăng nhập bằng Google</Button>
        </form>
        <p className="auth-foot">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </section>
      <aside className="auth-art">
        <div className="art-card">
          <span className="art-kicker">HÔM NAY</span>
          <strong>3 việc cần hoàn thành</strong>
          <div className="art-progress"><span style={{ width: '68%' }} /></div>
          <small>68% tiến độ tuần này</small>
        </div>
        <div className="art-note">“Một bước nhỏ mỗi ngày<br />sẽ tạo thành quãng đường dài.”</div>
      </aside>
    </main>

    <Modal open={destinationChooserOpen} title="Chào mừng quay lại" onClose={() => goToDestination('/dashboard')}>
      <div className="login-destination">
        <p>Bạn muốn bắt đầu ở đâu?</p>
        <div className="login-destination-options" role="group" aria-label="Chọn trang sau khi đăng nhập">
          <button
            type="button"
            className="login-destination-option admin"
            data-dialog-autofocus
            aria-label="Mở Trang quản trị"
            onClick={() => goToDestination('/admin')}
          >
            <span className="login-destination-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
            <span className="login-destination-content">
              <strong>Trang quản trị</strong>
              <small>Quản lý người dùng và theo dõi vận hành StudyFlow.</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="login-destination-option"
            aria-label="Mở Trang của tôi"
            onClick={() => goToDestination('/dashboard')}
          >
            <span className="login-destination-icon"><LayoutDashboard size={22} aria-hidden="true" /></span>
            <span className="login-destination-content">
              <strong>Trang của tôi</strong>
              <small>Tiếp tục với công việc, lịch và mục tiêu cá nhân.</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  </>
}
