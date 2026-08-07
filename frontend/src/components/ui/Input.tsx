import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes, MutableRefObject } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) ? new Date(year, month - 1, day) : null
}

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const weekday = first.getDay()
  const start = new Date(first)
  start.setDate(first.getDate() - (weekday === 0 ? 6 : weekday - 1))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function inputValue(value: InputHTMLAttributes<HTMLInputElement>['value'] | InputHTMLAttributes<HTMLInputElement>['defaultValue']) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const DateInputControl = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function DateInputControl({ value, defaultValue, onChange, name, disabled, ...props }, ref) {
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = useState(() => inputValue(controlled ? value : defaultValue))
  const currentValue = controlled ? inputValue(value) : internalValue
  const selectedDate = parseDate(currentValue)
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [month, setMonth] = useState(() => { const date = selectedDate ?? new Date(); return new Date(date.getFullYear(), date.getMonth(), 1) })
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const hiddenRef = useRef<HTMLInputElement | null>(null)
  const setRef = (node: HTMLInputElement | null) => { hiddenRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node }
  const cells = monthCells(month)
  const display = selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày'

  useEffect(() => {
    if (!controlled) return
    const next = parseDate(inputValue(value))
    if (next) setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
  }, [controlled, value])

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return
    const bounds = wrapperRef.current.getBoundingClientRect()
    setDropUp(bounds.bottom + 340 > window.innerHeight)
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const updateValue = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue)
    onChange?.({ target: { value: nextValue, name } } as ChangeEvent<HTMLInputElement>)
  }

  return <span className="date-input-control" ref={wrapperRef}><input ref={setRef} type="hidden" name={name} value={currentValue} readOnly {...props} /><button type="button" className="date-picker-trigger" onClick={() => setOpen((current) => !current)} aria-label="Chọn ngày" aria-expanded={open} disabled={disabled}><span>{display}</span><CalendarDays size={16} /></button>{open && <div className={`date-picker-popover${dropUp ? ' drop-up' : ''}`} role="dialog" aria-label="Chọn ngày"><div className="date-picker-head"><button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Tháng trước"><ChevronLeft size={16} /></button><strong>{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</strong><button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Tháng sau"><ChevronRight size={16} /></button></div><div className="date-picker-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="date-picker-days">{cells.map((day) => <button type="button" key={dayKey(day)} className={`${day.getMonth() !== month.getMonth() ? 'is-muted ' : ''}${dayKey(day) === currentValue ? 'is-selected' : ''}`} onClick={() => { updateValue(dayKey(day)); setOpen(false) }}>{day.getDate()}</button>)}</div><div className="date-picker-actions"><button type="button" onClick={() => { updateValue(''); setOpen(false) }}>Xóa</button><button type="button" onClick={() => { const today = new Date(); updateValue(dayKey(today)); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setOpen(false) }}>Hôm nay</button></div></div>}</span>
})

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, type, ...props }, ref) {
  const message = error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null
  return <label className="field">{label && <span>{label}</span>}{type === 'date' ? <DateInputControl ref={ref} {...props} /> : <input ref={ref} type={type} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} {...props} />}{message}</label>
})
