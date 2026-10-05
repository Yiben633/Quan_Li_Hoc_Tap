import type { ButtonHTMLAttributes, ReactNode } from 'react'
export function IconButton({ label, children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) { return <button type={type} className="icon-button" aria-label={label} title={label} {...props}>{children}</button> }
