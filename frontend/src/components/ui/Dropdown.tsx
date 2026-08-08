import { ChevronDown } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'

type DropdownProps = {
  label: ReactNode
  ariaLabel: string
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showChevron?: boolean
}

export function Dropdown({ label, ariaLabel, children, open, onOpenChange, showChevron = true }: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [focusLast, setFocusLast] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }
  const focusableItems = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') ?? [])
  const openMenu = (last = false) => {
    setFocusLast(last)
    setOpen(true)
  }

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      const items = focusableItems()
      ;(focusLast ? items[items.length - 1] : items[0])?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusLast, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnPointerDown)
    return () => document.removeEventListener('pointerdown', closeOnPointerDown)
  }, [isOpen])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(event.key === 'ArrowUp')
    }
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setOpen(false)
    }
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = focusableItems()
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    const focusItem = (index: number) => items[Math.max(0, Math.min(items.length - 1, index))]?.focus()
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'ArrowDown') { event.preventDefault(); focusItem(currentIndex + 1); return }
    if (event.key === 'ArrowUp') { event.preventDefault(); focusItem(currentIndex - 1); return }
    if (event.key === 'Home') { event.preventDefault(); focusItem(0); return }
    if (event.key === 'End') { event.preventDefault(); focusItem(items.length - 1); return }
    if (event.key === 'Tab') setOpen(false)
  }

  return <div className="dropdown" ref={wrapperRef}>
    <button ref={triggerRef} type="button" className="dropdown-trigger" onClick={() => isOpen ? setOpen(false) : openMenu()} onKeyDown={handleTriggerKeyDown} aria-label={ariaLabel} aria-expanded={isOpen} aria-haspopup="true" aria-controls={menuId}>{label}{showChevron && <ChevronDown size={14} />}</button>
    {isOpen && <div ref={menuRef} id={menuId} className="dropdown-menu" aria-label={ariaLabel} onKeyDown={handleMenuKeyDown} onClick={() => setOpen(false)}>{children}</div>}
  </div>
}
