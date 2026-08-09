import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const connected = () => setOnline(true)
    const disconnected = () => setOnline(false)
    window.addEventListener('online', connected)
    window.addEventListener('offline', disconnected)
    return () => {
      window.removeEventListener('online', connected)
      window.removeEventListener('offline', disconnected)
    }
  }, [])

  if (online) return null
  return <div className="network-status" role="status" aria-live="polite"><WifiOff size={16} /><span>Bạn đang ngoại tuyến. Thay đổi mới sẽ cần kết nối mạng.</span><Link to="/offline">Xem trạng thái</Link></div>
}
