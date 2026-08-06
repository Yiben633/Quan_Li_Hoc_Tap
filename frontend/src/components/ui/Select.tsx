import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, children, ...props }, ref) { return <label className="field">{label && <span>{label}</span>}<select ref={ref} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props}>{children}</select>{error && <small className="field-error">{error}</small>}</label> })
