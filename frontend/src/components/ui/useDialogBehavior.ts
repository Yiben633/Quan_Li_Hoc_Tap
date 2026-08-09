import { useEffect, useRef } from 'react'

export function useDialogBehavior(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const previousBodyOverflow = document.body.style.overflow
    const previousRootOverflow = root.style.overflow
    const previousPadding = document.body.style.paddingRight
    const previouslyFocused = document.activeElement as HTMLElement | null
    const scrollbarWidth = window.innerWidth - root.clientWidth
    document.body.style.overflow = 'hidden'
    root.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`

    const frame = window.requestAnimationFrame(() => {
      const firstControl = dialogRef.current?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')
      ;(firstControl ?? dialogRef.current)?.focus()
    })
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onCloseRef.current()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousBodyOverflow
      root.style.overflow = previousRootOverflow
      document.body.style.paddingRight = previousPadding
      previouslyFocused?.focus()
    }
  }, [open])

  return dialogRef
}
