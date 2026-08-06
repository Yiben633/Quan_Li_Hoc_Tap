import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
export function Dropdown({ label, children }: { label: ReactNode; children: ReactNode }) { const [open, setOpen] = useState(false); return <div className="dropdown"><button className="dropdown-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>{label}<ChevronDown size={14} /></button>{open && <div className="dropdown-menu" onClick={() => setOpen(false)}>{children}</div>}</div> }
