import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="screen-message">Loading your parking portal...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'owner' ? '/owner' : '/user'} replace />
  }

  return children
}
