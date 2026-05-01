import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Compass, LogOut, PencilLine, PlusCircle, Trash2, TrendingUp, X } from 'lucide-react'
import ParkingMap from '../components/ParkingMap'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const initialArea = {
  name: '',
  address: '',
  city: '',
  description: '',
  latitude: '',
  longitude: '',
  carSlots: 0,
  bikeSlots: 0,
  pricePerHour: 0,
}

export default function OwnerDashboard() {
  const { user, token, logout } = useAuth()
  const [areas, setAreas] = useState([])
  const [reservations, setReservations] = useState([])
  const [selectedArea, setSelectedArea] = useState(null)
  const [form, setForm] = useState(initialArea)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationLabel, setLocationLabel] = useState('Current location will be used when you register the parking area.')
  const [editingAreaId, setEditingAreaId] = useState(null)

  const loadOwnerData = useCallback(async () => {
    const [areaData, reservationData] = await Promise.all([
      api.getOwnerAreas(token),
      api.getMyReservations(token),
    ])
    setAreas(areaData.areas)
    setReservations(reservationData.reservations)
    setSelectedArea((current) => current || areaData.areas[0] || null)
  }, [token])

  useEffect(() => {
    loadOwnerData().catch((error) => setMessage(error.message))
  }, [loadOwnerData])

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available in this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          resolve({
            latitude: coords.latitude.toFixed(6),
            longitude: coords.longitude.toFixed(6),
          }),
        () => reject(new Error('Could not fetch your current location. Please allow location access and try again.')),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })

  const handleUseCurrentLocation = async () => {
    setMessage('')
    setGettingLocation(true)

    try {
      const coords = await getCurrentLocation()
      setForm((current) => ({
        ...current,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }))
      setLocationLabel(`Location ready: ${coords.latitude}, ${coords.longitude}`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setGettingLocation(false)
    }
  }

  const resetFormState = () => {
    setForm(initialArea)
    setEditingAreaId(null)
    setLocationLabel('Current location will be used when you register the parking area.')
  }

  const startEditingArea = (area) => {
    setEditingAreaId(area.id)
    setSelectedArea(area)
    setMessage('')
    setForm({
      name: area.name || '',
      address: area.address || '',
      city: area.city || '',
      description: area.description || '',
      latitude: String(area.latitude ?? ''),
      longitude: String(area.longitude ?? ''),
      carSlots: area.carSlots ?? 0,
      bikeSlots: area.bikeSlots ?? 0,
      pricePerHour: area.pricePerHour ?? 0,
    })
    setLocationLabel(`Editing coordinates: ${area.latitude}, ${area.longitude}`)
  }

  const handleDeleteArea = async (areaId) => {
    const confirmed = window.confirm('Delete this parking lot? This will also remove linked reservations and payments.')

    if (!confirmed) {
      return
    }

    setLoading(true)
    setMessage('')

    try {
      await api.deleteParkingArea(token, areaId)
      if (editingAreaId === areaId) {
        resetFormState()
      }
      setSelectedArea((current) => (current?.id === areaId ? null : current))
      setMessage('Parking area deleted successfully.')
      await loadOwnerData()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArea = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let payload = form

      if (!form.latitude || !form.longitude) {
        const coords = await getCurrentLocation()
        payload = {
          ...form,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }
        setForm(payload)
        setLocationLabel(`Location used: ${coords.latitude}, ${coords.longitude}`)
      }

      if (editingAreaId) {
        await api.updateParkingArea(token, editingAreaId, payload)
        setMessage('Parking area updated successfully.')
      } else {
        await api.createParkingArea(token, payload)
        setMessage('Parking area registered successfully.')
      }

      resetFormState()
      await loadOwnerData()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const now = new Date()
    const isSameDay = (date) =>
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    const isSameMonth = (date) =>
      date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

    const isSameYear = (date) => date.getFullYear() === now.getFullYear()

    const dailyIncome = reservations.reduce((sum, reservation) => {
      const date = new Date(reservation.createdAt)
      return isSameDay(date) ? sum + Number(reservation.amount || 0) : sum
    }, 0)

    const monthlyIncome = reservations.reduce((sum, reservation) => {
      const date = new Date(reservation.createdAt)
      return isSameMonth(date) ? sum + Number(reservation.amount || 0) : sum
    }, 0)

    const yearlyIncome = reservations.reduce((sum, reservation) => {
      const date = new Date(reservation.createdAt)
      return isSameYear(date) ? sum + Number(reservation.amount || 0) : sum
    }, 0)

    return {
      totalAreas: areas.length,
      dailyIncome,
      monthlyIncome,
      yearlyIncome,
      bookings: reservations.length,
    }
  }, [areas, reservations])

  return (
    <div className="dashboard-page coffee-dashboard-page">
      <header className="dashboard-header">
        <div>
          <Link className="brand coffee-brand" to="/">
            Parksphere
          </Link>
          <p className="dashboard-subtitle">Operator dashboard for parking setup, slot management, and revenue tracking.</p>
        </div>
        <div className="dashboard-actions">
          <span className="role-chip">Operator: {user.name}</span>
          <button type="button" className="ghost-action" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="stats-grid">
        <article className="glass-panel stat-card">
          <span>Daily income</span>
          <strong>₹{stats.dailyIncome}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>Monthly income</span>
          <strong>₹{stats.monthlyIncome}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>Yearly income</span>
          <strong>₹{stats.yearlyIncome}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>Total parking locations</span>
          <strong>{stats.totalAreas}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main">
          <div className="glass-panel form-panel">
            <div className="panel-title-row">
              <div>
                <span className="eyebrow">Operator Portal</span>
                <h1>{editingAreaId ? 'Update your parking lot details and save changes.' : 'Register a location, tune capacity, and publish your next lot.'}</h1>
              </div>
              <Building2 size={22} />
            </div>

            <div className="owner-note-grid">
              <article className="grid-card accent-card">
                <span>Current system state</span>
                <strong>{stats.bookings} bookings recorded</strong>
                <p>All reservations shown here come from the same backend rules used by the visitor side.</p>
              </article>
              <article className="grid-card">
                <span>Location setup</span>
                <strong>Use live coordinates</strong>
                <p>Grab current location automatically or enter the details manually before saving the venue.</p>
              </article>
            </div>

            <form className="owner-form" onSubmit={handleCreateArea}>
              <div className="owner-form-toolbar">
                <div>
                  <span className="eyebrow">{editingAreaId ? 'Edit Mode' : 'Create Mode'}</span>
                  <strong>{editingAreaId ? 'Editing an existing owner lot' : 'Create a new owner-managed parking lot'}</strong>
                </div>
                {editingAreaId ? (
                  <button type="button" className="ghost-action" onClick={resetFormState}>
                    <X size={16} />
                    Cancel edit
                  </button>
                ) : null}
              </div>

              <div className="two-inputs">
                <label>
                  Parking area name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </label>
                <label>
                  City
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </label>
              </div>

              <label>
                Address
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              </label>

              <label>
                Description
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <div className="two-inputs">
                <label>
                  Car slots
                  <input
                    type="number"
                    value={form.carSlots}
                    onChange={(e) => setForm({ ...form, carSlots: e.target.value })}
                    min="0"
                  />
                </label>
                <label>
                  Bike slots
                  <input
                    type="number"
                    value={form.bikeSlots}
                    onChange={(e) => setForm({ ...form, bikeSlots: e.target.value })}
                    min="0"
                  />
                </label>
              </div>

              <div className="two-inputs">
                <label>
                  Price per hour
                  <input
                    type="number"
                    value={form.pricePerHour}
                    onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
                    min="0"
                    required
                  />
                </label>
                <div className="location-box">
                  <span className="location-text">{locationLabel}</span>
                  <button type="button" className="ghost-action" onClick={handleUseCurrentLocation}>
                    <Compass size={16} />
                    {gettingLocation ? 'Fetching location...' : 'Use current location'}
                  </button>
                </div>
              </div>

              <div className="two-inputs">
                <label>
                  Latitude
                  <input
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Auto-filled from current location"
                    required
                  />
                </label>
                <label>
                  Longitude
                  <input
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Auto-filled from current location"
                    required
                  />
                </label>
              </div>

              {message ? <div className="inline-message">{message}</div> : null}

              <button type="submit" className="primary-action" disabled={loading}>
                {editingAreaId ? <PencilLine size={18} /> : <PlusCircle size={18} />}
                {loading ? 'Saving...' : editingAreaId ? 'Update parking area' : 'Register parking area'}
              </button>
            </form>
          </div>

          <ParkingMap
            userLocation={
              form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : undefined
            }
            parkingAreas={areas}
            selectedAreaId={selectedArea?.id}
            onSelectArea={setSelectedArea}
            height={360}
          />

          <div className="card-grid dashboard-card-grid">
            {areas.map((area) => (
              <article
                key={area.id}
                className={`parking-card glass-panel selectable-card edition-card owner-lot-card ${selectedArea?.id === area.id ? 'is-selected' : ''}`}
              >
                <button type="button" className="owner-lot-select" onClick={() => setSelectedArea(area)}>
                  <span className="edition-tag">Managed lot</span>
                  <div className="card-head">
                    <h3>{area.name}</h3>
                    <span>₹{area.pricePerHour}/hr</span>
                  </div>
                  <p>{area.description || area.address}</p>
                  <div className="meta-row">
                    <span>Cars: {area.availability?.car ?? area.carSlots}</span>
                    <span>Bikes: {area.availability?.bike ?? area.bikeSlots}</span>
                  </div>
                  <div className="meta-row">
                    <span>{area.city}</span>
                    <span>{area.address}</span>
                  </div>
                </button>
                <div className="owner-lot-actions">
                  <button
                    type="button"
                    className="owner-action-button"
                    onClick={() => startEditingArea(area)}
                  >
                    <PencilLine size={16} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="owner-action-button owner-action-danger"
                    onClick={() => handleDeleteArea(area.id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="dashboard-side">
          <div className="glass-panel reservation-panel">
            <div className="panel-title-row">
              <div>
                <span className="eyebrow">Revenue activity</span>
                <h2>Recent bookings</h2>
              </div>
              <TrendingUp size={20} />
            </div>
            <div className="reservation-list">
              {reservations.length ? (
                reservations.map((reservation) => (
                  <article key={reservation.id} className="reservation-item">
                    <strong>{reservation.parkingArea?.name}</strong>
                    <span>{reservation.vehicleNumber} · {reservation.vehicleType}</span>
                    <span>₹{reservation.amount} · {new Date(reservation.startTime).toLocaleString()}</span>
                  </article>
                ))
              ) : (
                <p className="empty-text">No bookings yet. Income stats will appear here as customers reserve your parking locations.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
