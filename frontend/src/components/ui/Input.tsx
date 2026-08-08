import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { DatePicker } from './DatePicker'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, type, ...props }, ref) {
  if (type === 'date') return <DatePicker ref={ref} label={label} error={error} hint={hint} {...props} />

  const message = error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null
  return <label className="field">{label && <span>{label}</span>}<input ref={ref} type={type} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} />{message}</label>
})
