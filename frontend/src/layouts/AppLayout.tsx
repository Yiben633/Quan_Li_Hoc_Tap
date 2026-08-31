import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { NetworkStatusBanner } from '../components/NetworkStatusBanner'

export function AppLayout() {
  const [open, setOpen] = useState(false)
  return <div className="app-shell">
    <Sidebar open={open} onClose={() => setOpen(false)} />
    <div className="app-main"><Topbar onMenu={() => setOpen(true)} menuOpen={open} /><NetworkStatusBanner /><main className="page-content"><Outlet /></main></div>
    {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Đóng menu" />}
  </div>
}
