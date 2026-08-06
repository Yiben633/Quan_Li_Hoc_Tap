import type { ReactNode } from 'react'
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'orange' | 'red' | 'violet' }) { return <span className={`badge ${tone}`}>{children}</span> }
