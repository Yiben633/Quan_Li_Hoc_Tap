import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
export function ConfirmDialog({ open, title = 'Xác nhận thao tác', description, onCancel, onConfirm, loading = false }: { open: boolean; title?: string; description: string; onCancel: () => void; onConfirm: () => void; loading?: boolean }) { return <Modal open={open} title={title} onClose={onCancel} footer={<><Button variant="secondary" onClick={onCancel}>Hủy</Button><Button variant="danger" loading={loading} onClick={onConfirm}>Xác nhận</Button></>}><div className="confirm-content"><span className="confirm-icon"><AlertTriangle size={20} /></span><p>{description}</p></div></Modal> }
