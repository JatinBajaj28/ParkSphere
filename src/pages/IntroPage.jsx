import { useEffect, useRef, useState } from 'react'

const TRAIL_IMAGES = [
  '/car-hero.jpg',
  '/bike-hero.jpg',
  '/car-hero.jpg',
  '/bike-hero.jpg',
  '/car-hero.jpg',
  '/bike-hero.jpg',
  '/car-hero.jpg',
  '/bike-hero.jpg',
]

export default function IntroPage({ onEnter }) {
  const [phase, setPhase] = useState('in')
  const overlayRef = useRef(null)
  const trailRefs = useRef([])
  const trailIndexRef = useRef(0)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const timersRef = useRef({})

  useEffect(() => {
    const t = setTimeout(() => setPhase('idle'), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    }
  }, [])

  const handleEnter = (e) => {
    e.stopPropagation()
    setPhase('out')
    setTimeout(onEnter, 700)
  }

  const handleMouseMove = (e) => {
    const rect = overlayRef.current?.getBoundingClientRect()
    if (!rect) return

    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    const dx = lx - lastPointRef.current.x
    const dy = ly - lastPointRef.current.y
    const dist = Math.hypot(dx, dy)

    if (dist < 48) return

    lastPointRef.current = { x: lx, y: ly }

    const idx = trailIndexRef.current % TRAIL_IMAGES.length
    const node = trailRefs.current[idx]
    if (!node) return

    const rotation = (Math.atan2(dy || 1, dx || 1) * 180) / Math.PI
    // vary size so images feel organic
    const sizes = [180, 150, 200, 160, 190, 145, 170, 155]
    const sz = sizes[idx % sizes.length]

    node.style.setProperty('--ix', `${lx}px`)
    node.style.setProperty('--iy', `${ly}px`)
    node.style.setProperty('--ir', `${rotation.toFixed(1)}deg`)
    node.style.setProperty('--is', sz + 'px')
    node.classList.remove('intro-trail-active')
    void node.offsetWidth
    node.classList.add('intro-trail-active')

    if (timersRef.current[idx]) clearTimeout(timersRef.current[idx])
    timersRef.current[idx] = setTimeout(() => {
      node?.classList.remove('intro-trail-active')
    }, 1000)

    trailIndexRef.current += 1
  }

  const handleMouseLeave = () => {
    trailRefs.current.forEach((n) => n?.classList.remove('intro-trail-active'))
  }

  return (
    <div
      className={`intro-overlay intro-phase-${phase}`}
      ref={overlayRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleEnter}
    >
      <div className="intro-noise" />
      <div className="intro-grid-lines" aria-hidden="true" />

      {/* Image Trail Layer */}
      <div className="intro-trail-layer" aria-hidden="true">
        {TRAIL_IMAGES.map((src, i) => (
          <img
            key={i}
            ref={(el) => { trailRefs.current[i] = el }}
            src={src}
            alt=""
            className="intro-trail-img"
          />
        ))}
      </div>

      <div className="intro-content" onClick={(e) => e.stopPropagation()}>
        <div className="intro-eyebrow">Urban Parking OS — Est. 2026</div>

        <div className="intro-wordmark">
          <span className="intro-word intro-word-1">PARK.</span>
          <span className="intro-word intro-word-2">PHERE.</span>
        </div>

        <div className="intro-tagline">
          <span>City Driven</span>
          <span className="intro-dot">·</span>
          <span>For Everyone</span>
          <span className="intro-dot">·</span>
          <span>Built for Arrival</span>
        </div>

        <button className="intro-enter" onClick={handleEnter} type="button">
          <span>Enter</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="intro-footer" onClick={(e) => e.stopPropagation()}>
        <span>Move your mouse · Click anywhere or Enter to continue</span>
      </div>
    </div>
  )
}
