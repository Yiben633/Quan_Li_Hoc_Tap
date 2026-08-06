import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type FilterOption = { value: string; label: string }

export function FilterSelect({ value, options, onChange, ariaLabel }: { value: string; options: FilterOption[]; onChange: (value: string) => void; ariaLabel: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape) }
  }, [])

  return <div className="filter-select" ref={ref}>
    <button type="button" className="filter-select-trigger" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.label}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div className="filter-select-menu" role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={`filter-select-option${option.value === value ? ' selected' : ''}`} key={option.value} onClick={() => { onChange(option.value); setOpen(false) }}><span>{option.label}</span></button>)}</div>}
  </div>
}
