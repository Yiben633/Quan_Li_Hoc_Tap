import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from './Input'

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string }

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker({ label, ...props }, ref) {
  return <Input ref={ref} type="date" label={label} {...props} />
})
