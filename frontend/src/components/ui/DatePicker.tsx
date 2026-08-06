import { CalendarDays } from 'lucide-react'
import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type DatePickerProps = InputHTMLAttributes<HTMLInputElement> & { label?: string }
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker({ label, ...props }, ref) { return <label className="field">{label && <span>{label}</span>}<span className="date-input"><input ref={ref} type="date" {...props} /><CalendarDays size={16} /></span></label> })
