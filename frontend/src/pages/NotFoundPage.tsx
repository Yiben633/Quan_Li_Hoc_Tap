import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()
  return <main className="system-page">
    <span className="system-page-code">404</span>
    <h1>Không tìm thấy trang</h1>
    <p>Đường dẫn có thể đã thay đổi hoặc nội dung không còn được công bố.</p>
    <div className="system-page-actions"><button type="button" className="button secondary" onClick={() => navigate(-1)}><ArrowLeft size={17} /> Quay lại</button><Link className="button primary" to="/"><Home size={17} /> Tổng quan</Link></div>
  </main>
}
