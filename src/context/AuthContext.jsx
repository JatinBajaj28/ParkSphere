import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'parking-management-auth'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    let mounted = true

    api
      .me(token)
      .then((data) => {
        if (mounted) {
          setUser(data.user)
        }
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY)
        if (mounted) {
          setToken('')
          setUser(null)
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [token])

  const handleAuthSuccess = ({ token: authToken, user: authUser }) => {
    localStorage.setItem(STORAGE_KEY, authToken)
    setToken(authToken)
    setUser(authUser)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setToken('')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login: async (payload) => {
        const data = await api.login(payload)
        handleAuthSuccess(data)
        return data
      },
      register: async (payload) => {
        const data = await api.register(payload)
        handleAuthSuccess(data)
        return data
      },
      logout,
    }),
    [loading, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
