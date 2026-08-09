import { AlertTriangle, Home, RotateCcw, WifiOff } from 'lucide-react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export function RouteErrorPage() {
  const error = useRouteError()
  const offline = !navigator.onLine
  const notFound = isRouteErrorResponse(error) && error.status === 404
  const title = offline ? 'Không có kết nối mạng' : notFound ? 'Không tìm thấy trang' : 'Không thể mở nội dung này'
  const description = offline
    ? 'Giao diện vẫn có thể mở từ bộ nhớ thiết bị, nhưng dữ liệu cá nhân luôn cần kết nối an toàn tới máy chủ.'
    : notFound ? 'Đường dẫn này không tồn tại hoặc đã được thay đổi.' : 'Đã có lỗi khi tải trang. Bạn có thể thử lại mà không làm mất dữ liệu đã lưu.'

  return <main className="system-page" role="alert">
    <span className={`system-page-icon ${offline ? 'warning' : 'danger'}`}>{offline ? <WifiOff size={26} /> : <AlertTriangle size={26} />}</span>
    <h1>{title}</h1>
    <p>{description}</p>
    <div className="system-page-actions"><button type="button" className="button primary" onClick={() => window.location.reload()}><RotateCcw size={17} /> Thử lại</button><Link className="button secondary" to="/"><Home size={17} /> Tổng quan</Link></div>
  </main>
}
