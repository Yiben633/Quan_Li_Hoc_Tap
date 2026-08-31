import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'
import { NetworkStatusBanner } from '../components/NetworkStatusBanner'

const sidebarCollapsedKey = 'studyflow_sidebar_collapsed'

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(sidebarCollapsedKey) === 'true'
  } catch {
    return false
  }
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed)

  useEffect(() => {
    try {
      localStorage.setItem(sidebarCollapsedKey, String(sidebarCollapsed))
    } catch {
      // Keep the current layout when storage is unavailable.
    }
  }, [sidebarCollapsed])

  return <div className={`app-shell${sidebarCollapsed ? ' sidebar-is-collapsed' : ''}`}>
    <Sidebar open={open} onClose={() => setOpen(false)} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} />
    <div className="app-main"><Topbar onMenu={() => setOpen(true)} menuOpen={open} /><NetworkStatusBanner /><main className="page-content"><Outlet /></main></div>
    {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Đóng menu" />}
  </div>
}
