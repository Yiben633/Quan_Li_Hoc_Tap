import { createElement, type HTMLAttributes, type ReactNode } from 'react'

type CardElement = 'article' | 'div' | 'section'

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: CardElement
  children?: ReactNode
  interactive?: boolean
}

export function Card({ as = 'div', children, className = '', interactive = false, ...props }: CardProps) {
  return createElement(as, {
    ...props,
    className: ['studyflow-card', interactive && 'studyflow-card-interactive', className].filter(Boolean).join(' '),
    children,
  })
}

export type CardPartProps = HTMLAttributes<HTMLDivElement> & { children?: ReactNode }

export function CardHeader({ children, className = '', ...props }: CardPartProps) {
  return <div className={['studyflow-card-header', className].filter(Boolean).join(' ')} {...props}>{children}</div>
}

export function CardTitle({ children, className = '', ...props }: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) {
  return <h2 className={['studyflow-card-title', className].filter(Boolean).join(' ')} {...props}>{children}</h2>
}

export function CardDescription({ children, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { children?: ReactNode }) {
  return <p className={['studyflow-card-description', className].filter(Boolean).join(' ')} {...props}>{children}</p>
}

export function CardContent({ children, className = '', ...props }: CardPartProps) {
  return <div className={['studyflow-card-content', className].filter(Boolean).join(' ')} {...props}>{children}</div>
}

export function CardFooter({ children, className = '', ...props }: CardPartProps) {
  return <div className={['studyflow-card-footer', className].filter(Boolean).join(' ')} {...props}>{children}</div>
}
