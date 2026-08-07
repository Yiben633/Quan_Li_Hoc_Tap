import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
export function Dropdown({ label, children, open, onOpenChange, showChevron = true }: { label: ReactNode; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; showChevron?: boolean }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolledOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  return <div className="dropdown"><button className="dropdown-trigger" onClick={() => setOpen(!isOpen)} aria-expanded={isOpen}>{label}{showChevron && <ChevronDown size={14} />}</button>{isOpen && <div className="dropdown-menu" onClick={() => setOpen(false)}>{children}</div>}</div>
}
