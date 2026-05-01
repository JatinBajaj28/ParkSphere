import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bike,
  Building2,
  CalendarRange,
  CarFront,
  CreditCard,
  Gauge,
  MapPinned,
  Radar,
  ShieldCheck,
  TimerReset,
  TrendingUp,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const platformHighlights = [
  {
    index: '01',
    title: 'Search the city in seconds',
    description:
      'Drivers discover nearby parking with clear availability, pricing, and vehicle-specific capacity before they ever arrive.',
  },
  {
    index: '02',
    title: 'Reserve a real arrival window',
    description:
      'Parksphere keeps booking simple with fixed start and end times, transparent totals, and a polished reservation flow.',
  },
  {
    index: '03',
    title: 'Operate multiple lots cleanly',
    description:
      'Owners manage locations, capacities, and income trends from the same platform without switching tools.',
  },
]

const featuredPlaces = [
  {
    tag: 'Core Flow',
    title: 'Driver Discovery',
    description: 'Nearby search, live slot counts, and faster reservations for cars and bikes.',
  },
  {
    tag: 'Ops Layer',
    title: 'Operator Control',
    description: 'Multi-location setup, capacity controls, and cleaner location publishing.',
  },
  {
    tag: 'Revenue',
    title: 'Business Visibility',
    description: 'Track booking activity with daily, monthly, and yearly income snapshots.',
  },
]

const faqItems = [
  {
    question: 'How does Parksphere work for drivers?',
    answer:
      'Drivers can search nearby parking within a 3 km radius, choose a vehicle type, reserve a time window, and complete a demo checkout flow.',
  },
  {
    question: 'What can operators manage?',
    answer:
      'Operators can add multiple parking areas, use their current location during registration, and review bookings with daily, monthly, and yearly income summaries.',
  },
  {
    question: 'Does the platform support both cars and bikes?',
    answer:
      'Yes. The booking flow and availability logic already support both vehicle types, with separate slot counts shown for each location.',
  },
  {
    question: 'Is the payment flow real?',
    answer:
      'The current implementation keeps the reservation and payment experience intact, but charges remain in demo mode for safe testing.',
  },
]

const fallbackAreas = [
  {
    id: 'fallback-1',
    name: 'Parksphere Central',
    description: 'High-turnover premium parking near offices, retail, and daily commuter routes.',
    city: 'Bengaluru',
    pricePerHour: 90,
    availability: { car: 48, bike: 34 },
  },
  {
    id: 'fallback-2',
    name: 'Parksphere Riverside',
    description: 'Designed for evenings, dining, and destination arrivals with pre-booked windows.',
    city: 'Hyderabad',
    pricePerHour: 70,
    availability: { car: 29, bike: 42 },
  },
  {
    id: 'fallback-3',
    name: 'Parksphere Exchange',
    description: 'Mixed-use operator space tuned for office peaks, events, and repeat users.',
    city: 'Mumbai',
    pricePerHour: 110,
    availability: { car: 52, bike: 18 },
  },
]

export default function HomePage() {
  const { user } = useAuth()
  const [areas, setAreas] = useState([])
  const trailRefs = useRef([])
  const trailIndexRef = useRef(0)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const trailTimersRef = useRef([])

  const customerPath = user ? (user.role === 'user' ? '/user' : '/auth?role=user') : '/auth?role=user'
  const ownerPath = user ? (user.role === 'owner' ? '/owner' : '/auth?role=owner') : '/auth?role=owner'

  useEffect(() => {
    api
      .getParkingAreas()
      .then((data) => setAreas(data.areas.slice(0, 3)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      trailTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const displayAreas = useMemo(() => (areas.length ? areas : fallbackAreas), [areas])
  const trailImages = useMemo(
    () => ['/car-hero.jpg', '/bike-hero.jpg', '/car-hero.jpg', '/bike-hero.jpg', '/car-hero.jpg', '/bike-hero.jpg'],
    []
  )

  const handleHeroPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2

    event.currentTarget.style.setProperty('--mx', x.toFixed(3))
    event.currentTarget.style.setProperty('--my', y.toFixed(3))

    const localX = event.clientX - rect.left
    const localY = event.clientY - rect.top
    const dx = localX - lastPointRef.current.x
    const dy = localY - lastPointRef.current.y
    const distance = Math.hypot(dx, dy)

    if (distance < 42) {
      return
    }

    lastPointRef.current = { x: localX, y: localY }

    const index = trailIndexRef.current % trailImages.length
    const node = trailRefs.current[index]

    if (!node) {
      return
    }

    const rotation = (Math.atan2(dy || 1, dx || 1) * 180) / Math.PI
    const scale = 0.88 + (index % 3) * 0.08

    node.style.setProperty('--trail-x', `${localX}px`)
    node.style.setProperty('--trail-y', `${localY}px`)
    node.style.setProperty('--trail-rotate', `${rotation.toFixed(2)}deg`)
    node.style.setProperty('--trail-scale', scale.toFixed(2))
    node.classList.remove('is-active')
    void node.offsetWidth
    node.classList.add('is-active')

    if (trailTimersRef.current[index]) {
      window.clearTimeout(trailTimersRef.current[index])
    }

    trailTimersRef.current[index] = window.setTimeout(() => {
      node.classList.remove('is-active')
    }, 900)

    trailIndexRef.current += 1
  }

  const handleHeroPointerLeave = (event) => {
    event.currentTarget.style.setProperty('--mx', '0')
    event.currentTarget.style.setProperty('--my', '0')
    trailRefs.current.forEach((node) => node?.classList.remove('is-active'))
  }

  return (
    <div className="app-shell park-home">
      <header className="site-header park-header">
        <div className="brand-wrap park-brand-wrap">
          <Link className="brand park-brand" to="/">
            Parksphere
          </Link>
          <span className="park-badge">Urban Parking OS</span>
        </div>

        <nav className="nav-links park-nav">
          <a href="#about">About</a>
          <a href="#platform">Platform</a>
          <a href="#locations">Locations</a>
          <a href="#faq">FAQ</a>
          <Link className="nav-cta park-nav-cta" to={customerPath}>
            Driver Login
          </Link>
        </nav>
      </header>

      <main className="park-main">
        <section className="park-hero">
          <div className="park-hero-top">
            <span className="park-hero-chip">Live Demo Build</span>
            <Link className="park-hero-link" to={ownerPath}>
              Operator Console
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="park-hero-copy">
            <h1>PARK.</h1>
            <h1>SPHERE.</h1>
          </div>

          <div className="park-hero-meta">
            <p>City Driven</p>
            <p>For Drivers & Operators</p>
            <p>Built For Modern Arrival Flow</p>
          </div>

          <div className="park-hero-bottom">
            <div className="park-hero-intro">
              <p className="park-hero-kicker">More than just parking inventory</p>
              <p className="park-hero-text">
                Parksphere turns booking, arrival, and operator control into one polished flow for urban parking.
              </p>
            </div>

            <div className="hero-actions park-hero-actions">
              <Link className="primary-action park-primary" to={customerPath}>
                Book A Slot
                <ArrowRight size={18} />
              </Link>
              <Link className="secondary-action park-secondary" to={ownerPath}>
                List Your Parking
              </Link>
            </div>
          </div>

          <div
            className="park-visual-stage"
            onMouseMove={handleHeroPointerMove}
            onMouseLeave={handleHeroPointerLeave}
          >
            <div className="park-grid-glow"></div>
            <img src="/car-hero.jpg" alt="Parksphere car parking preview" className="park-vehicle park-vehicle-main" />
            <img src="/bike-hero.jpg" alt="Parksphere bike parking preview" className="park-vehicle park-vehicle-side" />

            <div className="park-trail-layer" aria-hidden="true">
              {trailImages.map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  ref={(node) => {
                    trailRefs.current[index] = node
                  }}
                  src={image}
                  alt=""
                  className={`park-trail-image park-trail-${index + 1}`}
                />
              ))}
            </div>

            <div className="park-float park-float-a">
              <span>Live Capacity</span>
              <strong>{displayAreas.length} active locations</strong>
            </div>

            <div className="park-float park-float-b">
              <span>Driver Flow</span>
              <strong>Reserve before arrival</strong>
            </div>

            <div className="park-puck park-puck-a">
              <MapPinned size={16} />
              <span>Nearby search</span>
            </div>
            <div className="park-puck park-puck-b">
              <Bike size={16} />
              <span>Bike slots</span>
            </div>
            <div className="park-puck park-puck-c">
              <CarFront size={16} />
              <span>Car slots</span>
            </div>

            <div className="park-info-card park-info-card-a">
              <TrendingUp size={16} />
              <div>
                <strong>Revenue snapshots</strong>
                <span>Daily, monthly, yearly visibility</span>
              </div>
            </div>

            <div className="park-info-card park-info-card-b">
              <CalendarRange size={16} />
              <div>
                <strong>Timed booking</strong>
                <span>Fixed arrival and exit windows</span>
              </div>
            </div>
          </div>
        </section>

        <section className="park-statement" id="about">
          <div className="park-statement-inner">
            <span className="park-section-label">What Is Parksphere?</span>
            <h2>
              More than just <span>parking supply</span>, we design an arrival layer that keeps people, operators,
              and city movement aligned.
            </h2>
          </div>
        </section>

        <section className="park-story" id="platform">
          <div className="park-story-head">
            <div>
              <span className="park-section-label">Platform Story</span>
              <h2>Everything the product needs to feel premium and operational at the same time.</h2>
            </div>
            <p>
              The backend stays intact. The frontend becomes more editorial, more spacious, and much closer to the
              visual rhythm of the reference site.
            </p>
          </div>

          <div className="park-story-stack">
            {platformHighlights.map((item, index) => (
              <article key={item.index} className={`park-story-card park-tone-${index + 1}`}>
                <div className="park-story-copy">
                  <span className="park-story-index">{item.index}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="park-story-media">
                  {index === 0 ? <Radar size={34} /> : null}
                  {index === 1 ? <CreditCard size={34} /> : null}
                  {index === 2 ? <Building2 size={34} /> : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="park-feature-band">
          <article className="park-feature-card">
            <Gauge size={20} />
            <h3>Search Faster</h3>
            <p>Geolocation-powered discovery keeps the first interaction short and useful.</p>
          </article>
          <article className="park-feature-card">
            <ShieldCheck size={20} />
            <h3>Trust The Flow</h3>
            <p>Clear slots, clear times, and a cleaner reservation experience reduce uncertainty.</p>
          </article>
          <article className="park-feature-card">
            <TimerReset size={20} />
            <h3>Operate Smoothly</h3>
            <p>Owners publish spaces, manage capacity, and keep revenue in view from one system.</p>
          </article>
        </section>

        <section className="park-showcase" id="locations">
          <div className="park-showcase-top">
            <div>
              <span className="park-section-label">Featured Locations</span>
              <h2>Selected spaces with live pricing, capacity, and city-ready booking flow.</h2>
            </div>
            <div className="park-showcase-tags">
              {featuredPlaces.map((item) => (
                <span key={item.title}>{item.tag}</span>
              ))}
            </div>
          </div>

          <div className="park-location-grid">
            {displayAreas.map((area, index) => (
              <article key={area.id} className="park-location-card">
                <span className="park-location-tag">Location 0{index + 1}</span>
                <h3>{area.name}</h3>
                <p>{area.description || area.address}</p>
                <div className="park-location-meta">
                  <span>{area.city}</span>
                  <span>₹{area.pricePerHour}/hour</span>
                </div>
                <div className="park-location-meta">
                  <span>Cars {area.availability?.car ?? area.carSlots ?? 0}</span>
                  <span>Bikes {area.availability?.bike ?? area.bikeSlots ?? 0}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="park-faq" id="faq">
          <div className="park-faq-head">
            <div>
              <span className="park-section-label">Everything You Need To Know</span>
              <h2>The same parking product, expressed through a sharper visual identity.</h2>
            </div>
          </div>

          <div className="park-faq-list">
            {faqItems.map((item, index) => (
              <details key={item.question} className="park-faq-item" open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="park-footer-cta">
          <div>
            <span className="park-section-label">Ready To Launch?</span>
            <h2>Open the driver journey or jump straight into the operator side.</h2>
          </div>
          <div className="hero-actions">
            <Link className="primary-action park-primary" to={customerPath}>
              Driver Dashboard
            </Link>
            <Link className="secondary-action park-secondary" to={ownerPath}>
              Operator Dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
