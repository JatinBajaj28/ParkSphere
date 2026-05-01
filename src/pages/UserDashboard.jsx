import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarRange,
  CreditCard,
  LogOut,
  Navigation,
  Search,
  Sparkles,
  TimerReset,
} from 'lucide-react'
import ParkingMap from '../components/ParkingMap'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const nowPlusOneHour = () => {
  const date = new Date(Date.now() + 60 * 60 * 1000)
  return date.toISOString().slice(0, 16)
}

const nowPlusThreeHours = () => {
  const date = new Date(Date.now() + 3 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 16)
}

export default function UserDashboard() {
  const { user, token, logout } = useAuth()
  const [allAreas, setAllAreas] = useState([])
  const [nearbyAreas, setNearbyAreas] = useState([])
  const [reservations, setReservations] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Enable location to see parking within 3 km.')
  const [selectedArea, setSelectedArea] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [bookingMessage, setBookingMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    vehicleType: 'car',
    vehicleNumber: '',
    startTime: nowPlusOneHour(),
    endTime: nowPlusThreeHours(),
  })

  const loadAllData = useCallback(async () => {
    const [areaData, reservationData] = await Promise.all([
      api.getParkingAreas(),
      api.getMyReservations(token),
    ])

    setAllAreas(areaData.areas)
    setReservations(reservationData.reservations)
    setSelectedArea((current) => current || areaData.areas[0] || null)
  }, [token])

  useEffect(() => {
    loadAllData().catch((error) => setStatus(error.message))
  }, [loadAllData])

  const fetchNearby = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not available in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const currentLocation = [coords.latitude, coords.longitude]
        setUserLocation(currentLocation)

        try {
          const data = await api.getNearbyParking({
            lat: coords.latitude,
            lng: coords.longitude,
            radiusKm: 3,
          })
          setNearbyAreas(data.areas)
          setStatus(
            data.areas.length
              ? `Found ${data.areas.length} parking area(s) within 3 km.`
              : 'No parking areas were found within 3 km, so all registered areas are shown below.'
          )
        } catch (error) {
          setStatus(error.message)
        }
      },
      () => setStatus('Location access was denied. You can still browse all registered parking areas.')
    )
  }

  const visibleAreas = useMemo(() => {
    const source = nearbyAreas.length ? nearbyAreas : allAreas
    return source.filter((area) =>
      `${area.name} ${area.address} ${area.city}`.toLowerCase().includes(query.toLowerCase())
    )
  }, [allAreas, nearbyAreas, query])

  useEffect(() => {
    if (!visibleAreas.length) {
      return
    }

    if (!selectedArea || !visibleAreas.some((area) => area.id === selectedArea.id)) {
      setSelectedArea(visibleAreas[0])
    }
  }, [visibleAreas, selectedArea])

  const estimatedAmount = useMemo(() => {
    if (!selectedArea || !form.startTime || !form.endTime) {
      return 0
    }

    const hours = Math.max(
      (new Date(form.endTime).getTime() - new Date(form.startTime).getTime()) / (1000 * 60 * 60),
      1
    )
    return Math.ceil(hours * selectedArea.pricePerHour)
  }, [form.endTime, form.startTime, selectedArea])

  const submitReservation = async (event) => {
    event.preventDefault()

    if (!selectedArea) {
      setBookingMessage('Select a parking area before creating a reservation.')
      return
    }

    setSubmitting(true)
    setBookingMessage('')

    try {
      await api.createReservation(token, {
        parkingAreaId: selectedArea.id,
        ...form,
      })
      setBookingMessage('Demo reservation confirmed. No real payment was charged.')
      setForm((current) => ({ ...current, vehicleNumber: '' }))
      await loadAllData()
      if (userLocation) {
        const data = await api.getNearbyParking({
          lat: userLocation[0],
          lng: userLocation[1],
          radiusKm: 3,
        })
        setNearbyAreas(data.areas)
      }
    } catch (error) {
      setBookingMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const displayedAreas = visibleAreas.length ? visibleAreas : allAreas
  const availabilitySummary = displayedAreas.reduce(
    (totals, area) => ({
      car: totals.car + (area.availability?.car ?? area.carSlots ?? 0),
      bike: totals.bike + (area.availability?.bike ?? area.bikeSlots ?? 0),
    }),
    { car: 0, bike: 0 }
  )

  return (
    <div className="dashboard-page coffee-dashboard-page">
      <header className="dashboard-header">
        <div>
          <Link className="brand coffee-brand" to="/">
            Parksphere
          </Link>
          <p className="dashboard-subtitle">Driver dashboard for nearby search, fast booking, and fixed-time reservations.</p>
        </div>
        <div className="dashboard-actions">
          <span className="role-chip">Driver: {user.name}</span>
          <button type="button" className="ghost-action" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <section className="hero-dashboard glass-panel coffee-dashboard-hero">
        <div>
          <span className="eyebrow">Driver Portal</span>
          <h1>Find the right lot, time your arrival, and reserve in one pass.</h1>
          <p>{status}</p>
        </div>
        <div className="hero-actions dashboard-hero-actions">
          <button type="button" className="primary-action" onClick={fetchNearby}>
            <Navigation size={18} />
            Use my location
          </button>
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search by parking name or address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="stats-grid coffee-mini-stats">
        <article className="glass-panel stat-card">
          <span>Visible locations</span>
          <strong>{displayedAreas.length}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>Car spaces in view</span>
          <strong>{availabilitySummary.car}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>Bike spaces in view</span>
          <strong>{availabilitySummary.bike}</strong>
        </article>
        <article className="glass-panel stat-card">
          <span>My bookings</span>
          <strong>{reservations.length}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main">
          <ParkingMap
            userLocation={userLocation}
            parkingAreas={displayedAreas}
            selectedAreaId={selectedArea?.id}
            onSelectArea={setSelectedArea}
          />

          <div className="card-grid dashboard-card-grid">
            {displayedAreas.map((area) => (
              <button
                type="button"
                key={area.id}
                className={`parking-card glass-panel selectable-card edition-card ${selectedArea?.id === area.id ? 'is-selected' : ''}`}
                onClick={() => setSelectedArea(area)}
              >
                <span className="edition-tag">{area.distanceKm !== undefined ? `${area.distanceKm} km away` : 'Available now'}</span>
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
                  <span>₹{area.pricePerHour}/hr</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="dashboard-side">
          <form className="glass-panel booking-panel" onSubmit={submitReservation}>
            <div className="panel-title-row">
              <div>
                <span className="eyebrow">Reserve Slot</span>
                <h2>{selectedArea ? selectedArea.name : 'Select a parking area'}</h2>
              </div>
              <CreditCard size={20} />
            </div>

            <div className="inline-message">
              Demo payment mode is active. Reservations are saved and validated, but no real charge is processed.
            </div>

            <label>
              Vehicle type
              <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </select>
            </label>

            <label>
              Vehicle number
              <input
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })}
                placeholder="DL01AB1234"
                required
              />
            </label>

            <div className="two-inputs">
              <label>
                Start time
                <div className="field-icon-wrap">
                  <CalendarRange size={16} />
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
                </div>
              </label>
              <label>
                End time
                <div className="field-icon-wrap">
                  <CalendarRange size={16} />
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
                </div>
              </label>
            </div>

            <div className="booking-total">
              <span>Estimated total</span>
              <strong>₹{estimatedAmount}</strong>
            </div>

            {bookingMessage ? <div className="inline-message">{bookingMessage}</div> : null}

            <button type="submit" className="primary-action" disabled={submitting || !selectedArea}>
              <TimerReset size={18} />
              {submitting ? 'Confirming...' : 'Demo pay & reserve'}
            </button>
          </form>

          <div className="glass-panel reservation-panel">
            <span className="eyebrow">Recent arrivals</span>
            <h2>Recent bookings</h2>
            <div className="reservation-list">
              {reservations.length ? (
                reservations.map((reservation) => (
                  <article key={reservation.id} className="reservation-item">
                    <strong>{reservation.parkingArea?.name}</strong>
                    <span>{reservation.vehicleType.toUpperCase()} · {reservation.vehicleNumber}</span>
                    <span>
                      ₹{reservation.amount} · {new Date(reservation.startTime).toLocaleString()}
                    </span>
                    <span>
                      <Sparkles size={14} /> Demo booking
                    </span>
                  </article>
                ))
              ) : (
                <p className="empty-text">No reservations yet. Choose a parking area and create your first booking.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
