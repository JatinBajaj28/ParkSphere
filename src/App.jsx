import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import IntroPage from './pages/IntroPage'
import OwnerDashboard from './pages/OwnerDashboard'
import UserDashboard from './pages/UserDashboard'

function App() {
  const { user } = useAuth()
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('pp-intro-seen')
  })

  const handleEnter = () => {
    sessionStorage.setItem('pp-intro-seen', '1')
    setShowIntro(false)
  }

  return (
    <>
      {showIntro && <IntroPage onEnter={handleEnter} />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={user ? <Navigate to={user.role === 'owner' ? '/owner' : '/user'} replace /> : <AuthPage />} />
        <Route
          path="/user"
          element={
            <ProtectedRoute role="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner"
          element={
            <ProtectedRoute role="owner">
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
