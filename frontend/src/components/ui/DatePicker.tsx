import { CalendarDays } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
export function DatePicker({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) { return <label className="field">{label && <span>{label}</span>}<span className="date-input"><input type="date" {...props} /><CalendarDays size={16} /></span></label> }
