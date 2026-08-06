import { CalendarDays } from 'lucide-react'
import { forwardRef, useRef } from 'react'
import type { InputHTMLAttributes, MutableRefObject } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, ...props }, ref) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const setRef = (node: HTMLInputElement | null) => { inputRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node }
  const message = error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null
  return <label className="field">{label && <span>{label}</span>}{props.type === 'date' ? <span className="date-input-control"><input ref={setRef} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} /><button type="button" className="date-picker-button" aria-label="Mở lịch" onClick={() => inputRef.current?.showPicker?.()}><CalendarDays size={16} /></button></span> : <input ref={setRef} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} />}{message}</label>
})
