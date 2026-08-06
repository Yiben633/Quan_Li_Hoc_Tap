import { forwardRef, Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; customMenu?: boolean }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, children, customMenu, value, defaultValue, onChange, ...props }, ref) {
  customMenu = customMenu || props.name === 'status' || props.name === 'semesterId' || props['aria-label'] === 'Lọc không gian học' || props['aria-label'] === 'Lọc trạng thái' || props['aria-label'] === 'Lọc độ ưu tiên'
  customMenu = customMenu || String(props['aria-label'] ?? '').startsWith('Tr')
  const options = Children.toArray(children).filter(isValidElement).map((child) => { const option = child.props as { value?: string; children?: ReactNode }; return { value: String(option.value ?? ''), label: String(option.children ?? '') } })
  const [currentValue, setCurrentValue] = useState(String(value ?? defaultValue ?? ''))
  const selected = options.find((option) => option.value === String(value ?? currentValue)) ?? options[0]
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (!customMenu || !open || !wrapperRef.current) return; const bounds = wrapperRef.current.getBoundingClientRect(); setDropUp(bounds.bottom + 170 > window.innerHeight) }, [customMenu, open])
  useEffect(() => { if (!customMenu) return; const close = (event: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false) }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close) }, [customMenu])
  if (customMenu) return <label className="field">{label && <span>{label}</span>}<div className="custom-select" ref={wrapperRef}><input type="hidden" name={props.name} value={String(value ?? currentValue)} readOnly /><button type="button" className={`custom-select-trigger${error ? ' has-error' : ''}`} aria-label={props['aria-label'] ?? label} aria-expanded={open} disabled={props.disabled} onClick={() => setOpen((current) => !current)}><span>{selected?.label}</span><ChevronDown size={16} /></button>{open && <div className={`custom-select-menu${dropUp ? ' drop-up' : ''}`} role="listbox">{options.map((option) => <button type="button" role="option" aria-selected={option.value === String(value ?? currentValue)} className={`custom-select-option${option.value === String(value ?? currentValue) ? ' selected' : ''}`} key={option.value} onClick={() => { setCurrentValue(option.value); onChange?.({ target: { value: option.value } } as React.ChangeEvent<HTMLSelectElement>); setOpen(false) }}><span>{option.label}</span></button>)}</div>}</div>{error && <small className="field-error">{error}</small>}</label>
  return <label className="field">{label && <span>{label}</span>}<select ref={ref} className={error ? 'has-error' : ''} aria-invalid={Boolean(error)} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange} {...props}>{children}</select>{error && <small className="field-error">{error}</small>}</label>
})
