import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type SwitchProps = InputHTMLAttributes<HTMLInputElement> & { label: string }
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({ label, ...props }, ref) { return <label className="switch-field"><input ref={ref} type="checkbox" role="switch" {...props} /><span className="switch-track" /><span>{label}</span></label> })
