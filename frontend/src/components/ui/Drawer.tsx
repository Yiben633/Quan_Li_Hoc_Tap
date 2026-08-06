import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from './IconButton'
export function Drawer({ open, title, children, onClose, side = 'right' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; side?: 'left' | 'right' }) { if (!open) return null; return <div className="overlay drawer-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className={`drawer drawer-${side}`} role="dialog" aria-modal="true"><header className="modal-head"><h2>{title}</h2><IconButton label="Đóng" onClick={onClose}><X size={18} /></IconButton></header><div className="modal-body">{children}</div></aside></div> }
