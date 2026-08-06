import type { InputHTMLAttributes } from 'react'
export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="check-field"><input type="checkbox" {...props} /><span>{label}</span></label> }
