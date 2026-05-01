import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Building2, CarFront, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'user',
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const pageTitle = useMemo(
    () => (mode === 'login' ? 'Login to your Parksphere account' : 'Create your Parksphere account'),
    [mode]
  )

  useEffect(() => {
    const role = searchParams.get('role')

    if (role === 'owner' || role === 'user') {
      setForm((current) => ({ ...current, role }))
      setMode('register')
    }
  }, [searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const action = mode === 'login' ? login : register
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form

      const data = await action(payload)
      navigate(data.user.role === 'owner' ? '/owner' : '/user')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page coffee-auth-page">
      <div className="auth-backdrop"></div>
      <div className="auth-layout">
        <div className="auth-intro auth-story glass-panel">
          <Link to="/" className="brand coffee-brand">
            Parksphere
          </Link>
          <span className="eyebrow">Access Portal</span>
          <h1>Access the Parksphere platform built for drivers and operators.</h1>
          <p>
            Sign in as a driver to search nearby parking and reserve a slot, or continue as an operator to manage
            locations, capacities, and booking revenue from the same backend-powered system.
          </p>

          <div className="auth-pill-list">
            <span>
              <CarFront size={16} />
              Driver booking
            </span>
            <span>
              <Building2 size={16} />
              Operator controls
            </span>
            <span>
              <KeyRound size={16} />
              Secure access flow
            </span>
          </div>

          <div className="auth-showcase">
            <img src="/car-hero.jpg" alt="Luxury supercar showcase" />
            <div className="auth-showcase-copy">
              <span>Featured Garage</span>
              <strong>Supercar arrivals, premium slots, instant routing.</strong>
            </div>
          </div>
        </div>

        <form className="auth-card glass-panel coffee-auth-card" onSubmit={handleSubmit}>
          <div className="tab-row">
            <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your access pass'}</span>
          <h2>{pageTitle}</h2>

          {mode === 'register' ? (
            <>
              <label>
                Full name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="owner">Owner</option>
                </select>
              </label>
              <label>
                Phone number
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
            </>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          {message ? <div className="inline-message">{message}</div> : null}

          <button type="submit" className="primary-action" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Continue to dashboard' : 'Create your account'}
            {!loading ? <ArrowRight size={18} /> : null}
          </button>
        </form>
      </div>
    </div>
  )
}
