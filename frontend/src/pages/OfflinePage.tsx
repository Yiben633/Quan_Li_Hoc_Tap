import { RotateCcw, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OfflinePage() {
  const online = navigator.onLine
  return <main className="system-page">
    <span className={`system-page-icon ${online ? 'success' : 'warning'}`}><WifiOff size={26} /></span>
    <h1>{online ? 'Kết nối đã hoạt động' : 'Bạn đang ngoại tuyến'}</h1>
    <p>{online ? 'Bạn có thể quay lại StudyFlow và tiếp tục đồng bộ dữ liệu.' : 'Các trang đã mở có thể vẫn hiển thị, nhưng StudyFlow không cache API, tệp hoặc dữ liệu tài khoản nhạy cảm.'}</p>
    <div className="system-page-actions"><button type="button" className="button primary" onClick={() => window.location.reload()}><RotateCcw size={17} /> Kiểm tra lại</button><Link className="button secondary" to="/">Về tổng quan</Link></div>
  </main>
}
