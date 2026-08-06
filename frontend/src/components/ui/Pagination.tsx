import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton } from './IconButton'
export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) { return <div className="pagination"><IconButton label="Trang trước" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16} /></IconButton><span>Trang <strong>{page}</strong> / {totalPages}</span><IconButton label="Trang sau" disabled={page >= totalPages} onClick={() => onChange(page + 1)}><ChevronRight size={16} /></IconButton></div> }
