import { Navigate } from 'react-router-dom'
import { clearCurrentUser, getCurrentUser } from '../../services/userStorage'

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const user = getCurrentUser()

  if (!user || !user.correo) {
    return <Navigate to="/" replace />
  }

  if (user.bloqueado) {
    clearCurrentUser()
    return <Navigate to="/" replace />
  }

  if (requireAdmin && user.rol !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
