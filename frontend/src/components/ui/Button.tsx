import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean; children: ReactNode }
export function Button({ variant = 'primary', loading = false, disabled, className = '', children, ...props }: ButtonProps) { return <button className={`button ${variant} ${className}`.trim()} disabled={disabled || loading} {...props}>{loading && <LoaderCircle className="spin" size={16} />}{children}</button> }
