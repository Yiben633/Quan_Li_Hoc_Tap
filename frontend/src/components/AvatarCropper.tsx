import { useEffect, useRef, useState } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'
import { Button, IconButton, Modal } from './ui'

export function AvatarCropper({ file, onCancel, onComplete }: { file: File | null; onCancel: () => void; onComplete: (file: File) => void }) {
  const [source, setSource] = useState('')
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  useEffect(() => { if (!file) { setSource(''); return }; const url = URL.createObjectURL(file); setSource(url); setZoom(1); setOffsetX(0); setOffsetY(0); return () => URL.revokeObjectURL(url) }, [file])
  if (!file || !source) return null
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); lastPointer.current = { x: event.clientX, y: event.clientY }; setDragging(true) }
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => { if (!dragging) return; const dx = event.clientX - lastPointer.current.x; const dy = event.clientY - lastPointer.current.y; lastPointer.current = { x: event.clientX, y: event.clientY }; setOffsetX((value) => Math.max(-120, Math.min(120, value + dx))); setOffsetY((value) => Math.max(-120, Math.min(120, value + dy))) }
  const stopDrag = () => setDragging(false)
  const complete = () => { const image = new Image(); image.onload = () => { const size = 512; const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const context = canvas.getContext('2d'); if (!context) return; const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * zoom; const width = image.naturalWidth * scale; const height = image.naturalHeight * scale; context.drawImage(image, (size - width) / 2 + offsetX, (size - height) / 2 + offsetY, width, height); canvas.toBlob((blob) => blob && onComplete(new File([blob], 'avatar-cropped.png', { type: 'image/png' })), 'image/png', .92) }; image.src = source }
  return <Modal open title="Điều chỉnh ảnh đại diện" onClose={onCancel} footer={<><Button type="button" variant="secondary" onClick={onCancel}><X size={15} /> Hủy</Button><Button type="button" onClick={complete}><Check size={15} /> Dùng ảnh này</Button></>}><div className="avatar-cropper"><div className={`crop-viewport ${dragging ? 'is-dragging' : ''}`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onPointerLeave={stopDrag}><img src={source} alt="Xem trước ảnh đại diện" draggable={false} style={{ transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${zoom})` }} /></div><div className="crop-control"><IconButton label="Thu nhỏ" onClick={() => setZoom(Math.max(1, zoom - .1))}><Minus size={15} /></IconButton><input aria-label="Mức phóng to" type="range" min="1" max="3" step=".05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><IconButton label="Phóng to" onClick={() => setZoom(Math.min(3, zoom + .1))}><Plus size={15} /></IconButton></div><p className="subtle">Kéo trực tiếp hình ảnh trong khung để căn khuôn mặt hoặc phần ảnh bạn muốn giữ lại.</p></div></Modal>
}
