import type { InputHTMLAttributes } from 'react'
export function Switch({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="switch-field"><input type="checkbox" role="switch" {...props} /><span className="switch-track" /><span>{label}</span></label> }
