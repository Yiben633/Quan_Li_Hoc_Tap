import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Select } from '../components/ui'
import { getApiErrorMessage } from '../features/auth/auth.api'
import { useRegisterMutation } from '../features/auth/auth.hooks'
import { registerSchema, type RegisterValues } from '../features/auth/auth.schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const mutation = useRegisterMutation()
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema), mode: 'onChange',
    defaultValues: { fullName: '', email: '', studentCode: '', password: '', confirmPassword: '', school: '', major: '', courseYear: undefined },
  })
  const submit = (values: RegisterValues) => mutation.mutate(values, { onSuccess: () => navigate('/login', { replace: true, state: { registered: true } }) })
  return <main className="auth-page auth-page-form"><section className="auth-panel"><Link className="back-link" to="/login"><ArrowLeft size={15} /> Quay lại đăng nhập</Link><div className="auth-logo"><span className="brand-mark"><GraduationCap size={20} /></span>StudyFlow</div><div className="auth-copy"><p className="eyebrow">BẮT ĐẦU HÀNH TRÌNH</p><h1>Tạo không gian<br /><em>học của riêng bạn.</em></h1><p>Thông tin này giúp StudyFlow cá nhân hóa kế hoạch học tập.</p></div><form className="auth-form register-form" onSubmit={handleSubmit(submit)} noValidate><Input label="Họ và tên" placeholder="Nguyễn Văn An" error={errors.fullName?.message} {...register('fullName')} /><div className="form-grid"><Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} /><Input label="Mã sinh viên" placeholder="21D123456" error={errors.studentCode?.message} {...register('studentCode')} /></div><div className="form-grid"><Input label="Trường" placeholder="Tên trường" error={errors.school?.message} {...register('school')} /><Input label="Chuyên ngành" placeholder="Công nghệ thông tin" error={errors.major?.message} {...register('major')} /></div><div className="form-grid"><Select label="Năm nhập học" error={errors.courseYear?.message} {...register('courseYear', { setValueAs: (value) => value === '' ? undefined : Number(value) })}><option value="">Chọn năm</option>{Array.from({ length: 8 }, (_, index) => 2025 - index).map((year) => <option key={year} value={year}>{year}</option>)}</Select><div /></div><div className="form-grid"><Input label="Mật khẩu" type="password" placeholder="Tối thiểu 8 ký tự" error={errors.password?.message} {...register('password')} /><Input label="Nhập lại mật khẩu" type="password" placeholder="Nhập lại mật khẩu" error={errors.confirmPassword?.message} {...register('confirmPassword')} /></div>{mutation.isError && <p className="form-api-error" role="alert">{getApiErrorMessage(mutation.error, 'Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.')}</p>}<Button className="wide" type="submit" loading={mutation.isPending}>Tạo tài khoản <ArrowRight size={17} /></Button></form></section><aside className="auth-art register-art"><div className="art-card"><span className="art-kicker">BẠN SẼ CÓ</span><strong>Một nhịp học rõ ràng hơn</strong><p className="subtle"><span className="art-check"><Check size={13} /></span> Quản lý môn học và deadline</p><p className="subtle"><span className="art-check"><Check size={13} /></span> Theo dõi tiến độ mỗi tuần</p><p className="subtle"><span className="art-check"><Check size={13} /></span> Tập trung với Pomodoro</p></div></aside></main>
}
