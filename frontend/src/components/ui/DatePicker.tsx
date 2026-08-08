import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { forwardRef, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent, MutableRefObject } from 'react'

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
  hint?: string
}

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) && dayKey(date) === value ? date : null
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const weekday = first.getDay()
  const start = addDays(first, -(weekday === 0 ? 6 : weekday - 1))
  return Array.from({ length: 42 }, (_, index) => addDays(start, index))
}

function toInputValue(value: InputHTMLAttributes<HTMLInputElement>['value'] | InputHTMLAttributes<HTMLInputElement>['defaultValue']) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker({ label, error, hint, value, defaultValue, onChange, name, disabled, min, max, required, 'aria-label': ariaLabel, ...props }, ref) {
  const controlled = value !== undefined
  const [internalValue, setInternalValue] = useState(() => toInputValue(controlled ? value : defaultValue))
  const currentValue = controlled ? toInputValue(value) : internalValue
  const selectedDate = parseDate(currentValue)
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [month, setMonth] = useState(() => {
    const date = selectedDate ?? new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [activeDate, setActiveDate] = useState(() => selectedDate ?? new Date())
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverId = useId()
  const cells = monthCells(month)
  const display = selectedDate ? selectedDate.toLocaleDateString('vi-VN') : 'Chọn ngày'
  const message = error ? <small className="field-error">{error}</small> : hint ? <small className="field-hint">{hint}</small> : null
  const isUnavailable = (date: Date) => (min ? dayKey(date) < min : false) || (max ? dayKey(date) > max : false)

  const setRef = (node: HTMLInputElement | null) => {
    if (typeof ref === 'function') ref(node)
    else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node
  }

  useEffect(() => {
    if (!controlled) return
    const next = parseDate(toInputValue(value))
    if (!next) return
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    setActiveDate(next)
  }, [controlled, value])

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return
    const bounds = wrapperRef.current.getBoundingClientRect()
    setDropUp(bounds.bottom + 340 > window.innerHeight)
  }, [open])

  useEffect(() => {
    if (!open) return
    const focusDate = selectedDate ?? new Date()
    setActiveDate(focusDate)
    setMonth(new Date(focusDate.getFullYear(), focusDate.getMonth(), 1))
    const closeOnPointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnPointerDown)
    const frame = window.requestAnimationFrame(() => {
      wrapperRef.current?.querySelector<HTMLButtonElement>(`[data-date="${dayKey(focusDate)}"]`)?.focus()
    })
    return () => {
      document.removeEventListener('mousedown', closeOnPointerDown)
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  const updateValue = (nextValue: string) => {
    if (!controlled) setInternalValue(nextValue)
    onChange?.({ target: { value: nextValue, name } } as ChangeEvent<HTMLInputElement>)
  }

  const openPicker = () => {
    if (!disabled) setOpen((current) => !current)
  }

  const moveActiveDate = (next: Date) => {
    setActiveDate(next)
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    window.requestAnimationFrame(() => {
      wrapperRef.current?.querySelector<HTMLButtonElement>(`[data-date="${dayKey(next)}"]`)?.focus()
    })
  }

  const selectDate = (date: Date) => {
    if (isUnavailable(date)) return
    updateValue(dayKey(date))
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: Date | null = null
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectDate(activeDate)
      return
    }
    if (event.key === 'ArrowLeft') next = addDays(activeDate, -1)
    if (event.key === 'ArrowRight') next = addDays(activeDate, 1)
    if (event.key === 'ArrowUp') next = addDays(activeDate, -7)
    if (event.key === 'ArrowDown') next = addDays(activeDate, 7)
    if (event.key === 'Home') next = addDays(activeDate, -(activeDate.getDay() === 0 ? 6 : activeDate.getDay() - 1))
    if (event.key === 'End') next = addDays(activeDate, 7 - (activeDate.getDay() === 0 ? 7 : activeDate.getDay()))
    if (event.key === 'PageUp') next = new Date(activeDate.getFullYear() - (event.shiftKey ? 1 : 0), activeDate.getMonth() - (event.shiftKey ? 0 : 1), activeDate.getDate())
    if (event.key === 'PageDown') next = new Date(activeDate.getFullYear() + (event.shiftKey ? 1 : 0), activeDate.getMonth() + (event.shiftKey ? 0 : 1), activeDate.getDate())
    if (next) {
      event.preventDefault()
      moveActiveDate(next)
    }
  }

  return <label className="field">
    {label && <span>{label}</span>}
    <span className="date-input-control" ref={wrapperRef}>
      <input ref={setRef} type="hidden" name={name} value={currentValue} readOnly disabled={disabled} required={required} min={min} max={max} {...props} />
      <button ref={triggerRef} type="button" className="date-picker-trigger" onClick={openPicker} aria-label={ariaLabel ?? label ?? 'Chọn ngày'} aria-haspopup="dialog" aria-controls={popoverId} aria-expanded={open} disabled={disabled} aria-invalid={Boolean(error)}>
        <span>{display}</span><CalendarDays size={16} />
      </button>
      {open && <div id={popoverId} className={`date-picker-popover${dropUp ? ' drop-up' : ''}`} role="dialog" aria-label={ariaLabel ?? label ?? 'Chọn ngày'} onKeyDown={handleCalendarKeyDown}>
        <div className="date-picker-head">
          <button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Tháng trước"><ChevronLeft size={16} /></button>
          <strong aria-live="polite">{month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</strong>
          <button type="button" className="icon-button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Tháng sau"><ChevronRight size={16} /></button>
        </div>
        <div className="date-picker-weekdays" aria-hidden="true">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="date-picker-days" role="grid" aria-label="Lịch chọn ngày">
          {cells.map((day) => {
            const key = dayKey(day)
            const unavailable = isUnavailable(day)
            return <button type="button" role="gridcell" key={key} data-date={key} className={`${day.getMonth() !== month.getMonth() ? 'is-muted ' : ''}${key === currentValue ? 'is-selected' : ''}`} onClick={() => selectDate(day)} disabled={unavailable} tabIndex={key === dayKey(activeDate) ? 0 : -1} aria-selected={key === currentValue} aria-label={day.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>{day.getDate()}</button>
          })}
        </div>
        <div className="date-picker-actions"><button type="button" onClick={() => { updateValue(''); setOpen(false); triggerRef.current?.focus() }}>Xóa</button><button type="button" onClick={() => selectDate(new Date())}>Hôm nay</button></div>
      </div>}
    </span>
    {message}
  </label>
})
