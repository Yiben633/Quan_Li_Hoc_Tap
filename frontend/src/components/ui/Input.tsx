import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, ...props }, ref) { return <label className="field">{label && <span>{label}</span>}<input ref={ref} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} />{error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null}</label> })
