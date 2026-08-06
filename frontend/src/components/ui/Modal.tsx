import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from './IconButton'
export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) { if (!open) return null; return <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header className="modal-head"><h2 id="modal-title">{title}</h2><IconButton label="Đóng" onClick={onClose}><X size={18} /></IconButton></header><div className="modal-body">{children}</div>{footer && <footer className="modal-foot">{footer}</footer>}</section></div> }
