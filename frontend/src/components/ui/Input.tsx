import { forwardRef, useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { DatePicker } from './DatePicker'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, type, className, id, ...props }, ref) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [showPassword, setShowPassword] = useState(false)

  if (type === 'date') return <DatePicker ref={ref} label={label} error={error} hint={hint} {...props} />

  const message = error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null
  const isPassword = type === 'password'
  const inputClassName = [className, error ? 'has-error' : '', isPassword ? 'has-password-toggle' : ''].filter(Boolean).join(' ')

  return <div className="field">
    {label && <label htmlFor={inputId}>{label}</label>}
    {isPassword ? <span className="password-input-control">
      <input ref={ref} id={inputId} type={showPassword ? 'text' : 'password'} className={inputClassName} aria-invalid={Boolean(error)} {...props} />
      <button
        type="button"
        className="password-toggle"
        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        aria-pressed={showPassword}
        onClick={() => setShowPassword((current) => !current)}
      >
        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span> : <input ref={ref} id={inputId} type={type} className={inputClassName} aria-invalid={Boolean(error)} {...props} />}
    {message}
  </div>
})
