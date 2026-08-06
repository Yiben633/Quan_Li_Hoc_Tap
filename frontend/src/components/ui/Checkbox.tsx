import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: string }
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, ...props }, ref) { return <label className="check-field"><input ref={ref} type="checkbox" {...props} /><span>{label}</span></label> })
