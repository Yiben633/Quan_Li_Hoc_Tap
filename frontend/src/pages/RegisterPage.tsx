import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useRegisterMutation } from '../features/auth/auth.hooks'
import { registerSchema, type RegisterValues } from '../features/auth/auth.schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const mutation = useRegisterMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: 'onChange', defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' } })
  const submit = (values: RegisterValues) => mutation.mutate(values, { onSuccess: () => navigate('/login', { replace: true, state: { registered: true } }) })
  return <main className="auth-page auth-page-form"><section className="auth-panel"><Link className="back-link" to="/login"><ArrowLeft size={15} /> Quay lại đăng nhập</Link><div className="auth-logo"><span className="brand-mark"><GraduationCap size={20} /></span>StudyFlow</div><div className="auth-copy"><p className="eyebrow">BẮT ĐẦU HÀNH TRÌNH</p><h1>Tạo không gian<br /><em>học của riêng bạn.</em></h1><p>Chỉ cần vài thông tin cơ bản để bắt đầu một nhịp học phù hợp với bạn.</p></div><form className="auth-form register-form" onSubmit={handleSubmit(submit)} noValidate><Input label="Họ và tên" placeholder="Nguyễn Văn An" error={errors.fullName?.message} {...register('fullName')} /><Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} /><div className="form-grid"><Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" error={errors.password?.message} {...register('password')} /><Input label="Nhập lại mật khẩu" type="password" placeholder="Nhập lại mật khẩu" error={errors.confirmPassword?.message} {...register('confirmPassword')} /></div>{mutation.isError && <p className="form-api-error" role="alert">{getApiErrorMessage(mutation.error, 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.')}</p>}<Button className="wide" type="submit" loading={mutation.isPending}>Tạo tài khoản <ArrowRight size={17} /></Button></form></section><aside className="auth-art register-art"><div className="art-card"><span className="art-kicker">BẠN SẼ CÓ</span><strong>Một nhịp học rõ ràng hơn</strong><p className="subtle"><span className="art-check"><Check size={13} /></span> Quản lý mục tiêu cá nhân</p><p className="subtle"><span className="art-check"><Check size={13} /></span> Theo dõi tiến độ mỗi ngày</p><p className="subtle"><span className="art-check"><Check size={13} /></span> Tập trung theo cách của bạn</p></div></aside></main>
}
