import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { IconButton } from './IconButton'
import { useDialogBehavior } from './useDialogBehavior'

export function Drawer({ open, title, children, onClose, side = 'right' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; side?: 'left' | 'right' }) {
  const titleId = useId()
  const dialogRef = useDialogBehavior(open, onClose)
  if (!open) return null
  return <div className="overlay drawer-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside ref={dialogRef} className={`drawer drawer-${side}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><header className="modal-head"><h2 id={titleId}>{title}</h2><IconButton label="Đóng" onClick={onClose}><X size={18} /></IconButton></header><div className="modal-body">{children}</div></aside></div>
}
