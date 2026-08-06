import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export function ProtectedRoute() {
  const token = useAuthStore((state) => state.accessToken)
  const location = useLocation()
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function AdminRoute() {
  const user = useAuthStore((state) => state.user)
  return user?.roles?.includes('admin') ? <Outlet /> : <Navigate to="/" replace />
}
