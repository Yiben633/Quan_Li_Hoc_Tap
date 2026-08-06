import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, ...props }, ref) { return <label className="field">{label && <span>{label}</span>}<textarea ref={ref} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} />{error && <small className="field-error">{error}</small>}</label> })
