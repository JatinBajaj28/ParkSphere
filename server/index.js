import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDatabase, initializeDatabase } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8787
const JWT_SECRET = process.env.JWT_SECRET || 'parksphere-secret'
const DIST_PATH = path.join(__dirname, '..', 'dist')

app.use(cors())
app.use(express.json())

const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

const normalizeDate = (value) => {
  if (!value) {
    return value
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

const createToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  })

const mapUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  phone: row.phone || '',
  createdAt: normalizeDate(row.created_at),
})

const mapArea = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  address: row.address,
  city: row.city,
  description: row.description || '',
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  carSlots: Number(row.car_slots),
  bikeSlots: Number(row.bike_slots),
  pricePerHour: Number(row.price_per_hour),
  createdAt: normalizeDate(row.created_at),
})

const mapJoinedArea = (row) => {
  if (!row.area_id) {
    return null
  }

  return {
    id: row.area_id,
    ownerId: row.area_owner_id,
    name: row.area_name,
    address: row.area_address,
    city: row.area_city,
    description: row.area_description || '',
    latitude: Number(row.area_latitude),
    longitude: Number(row.area_longitude),
    carSlots: Number(row.area_car_slots),
    bikeSlots: Number(row.area_bike_slots),
    pricePerHour: Number(row.area_price_per_hour),
    createdAt: normalizeDate(row.area_created_at),
  }
}

const mapReservation = (row) => ({
  id: row.id,
  userId: row.user_id,
  parkingAreaId: row.parking_area_id,
  vehicleType: row.vehicle_type,
  vehicleNumber: row.vehicle_number,
  startTime: normalizeDate(row.start_time),
  endTime: normalizeDate(row.end_time),
  durationHours: Number(row.duration_hours),
  amount: Number(row.amount),
  status: row.status,
  createdAt: normalizeDate(row.created_at),
  parkingArea: mapJoinedArea(row),
})

const sanitizeUser = (user) => {
  const safeUser = { ...user }
  delete safeUser.passwordHash
  return safeUser
}

const toRadians = (value) => (value * Math.PI) / 180

const distanceInKm = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getAreaAvailability = async (db, area, startTime, endTime) => {
  const result = await db.query(
    `
      SELECT vehicle_type, COUNT(*)::int AS total
      FROM reservations
      WHERE parking_area_id = $1
        AND status = 'confirmed'
        AND start_time < $2::timestamp
        AND end_time > $3::timestamp
      GROUP BY vehicle_type
    `,
    [area.id, endTime, startTime]
  )

  const counts = Object.fromEntries(
    result.rows.map((row) => [row.vehicle_type, Number(row.total)])
  )

  return {
    car: Math.max(area.carSlots - (counts.car || 0), 0),
    bike: Math.max(area.bikeSlots - (counts.bike || 0), 0),
  }
}

const authRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Authorization token is missing.' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const db = getDatabase()
    const result = await db.query('SELECT * FROM users WHERE id = $1', [payload.id])

    if (!result.rows[0]) {
      return res.status(401).json({ message: 'User session is invalid.' })
    }

    req.user = mapUser(result.rows[0])
    req.db = db
    next()
  } catch {
    return res.status(401).json({ message: 'Authorization token is invalid.' })
  }
}

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: `Only ${role} accounts can access this route.` })
  }

  next()
}

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, database: 'postgresql' })
})

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, phone } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' })
  }

  if (!['user', 'owner'].includes(role)) {
    return res.status(400).json({ message: 'Role must be either user or owner.' })
  }

  const db = getDatabase()
  const normalizedEmail = String(email).toLowerCase()
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])

  if (existingUser.rows[0]) {
    return res.status(409).json({ message: 'An account already exists with this email.' })
  }

  const user = {
    id: createId(role),
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    phone: phone || '',
    role,
    createdAt: new Date().toISOString(),
  }

  await db.query(
    `
      INSERT INTO users (id, name, email, password_hash, role, phone, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [user.id, user.name, user.email, user.passwordHash, user.role, user.phone, user.createdAt]
  )

  const token = createToken(user)
  res.status(201).json({ token, user: sanitizeUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  const db = getDatabase()
  const result = await db.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase()])
  const row = result.rows[0]

  if (!row) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const user = mapUser(row)
  const validPassword = await bcrypt.compare(password, user.passwordHash)

  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' })
  }

  const token = createToken(user)
  res.json({ token, user: sanitizeUser(user) })
})

app.get('/api/auth/me', authRequired, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) })
})

app.get('/api/parking-areas', async (req, res) => {
  const { q = '' } = req.query
  const db = getDatabase()
  const start = new Date().toISOString()
  const end = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const result = await db.query(
    `
      SELECT *
      FROM parking_areas
      WHERE LOWER(CONCAT(name, ' ', address, ' ', city)) LIKE $1
      ORDER BY created_at DESC
    `,
    [`%${String(q).toLowerCase()}%`]
  )

  const areas = await Promise.all(
    result.rows.map(async (row) => {
      const area = mapArea(row)
      return {
        ...area,
        availability: await getAreaAvailability(db, area, start, end),
      }
    })
  )

  res.json({ areas })
})

app.get('/api/parking-areas/nearby', async (req, res) => {
  const { lat, lng, radiusKm = 3 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' })
  }

  const db = getDatabase()
  const start = new Date().toISOString()
  const end = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const userLat = Number(lat)
  const userLng = Number(lng)
  const radius = Number(radiusKm)
  const result = await db.query('SELECT * FROM parking_areas ORDER BY created_at DESC')

  const nearbyAreas = await Promise.all(
    result.rows.map(async (row) => {
      const area = mapArea(row)
      const distanceKmValue = distanceInKm(userLat, userLng, area.latitude, area.longitude)

      return {
        ...area,
        distanceKm: Number(distanceKmValue.toFixed(2)),
        availability: await getAreaAvailability(db, area, start, end),
      }
    })
  )

  res.json({
    areas: nearbyAreas
      .filter((area) => area.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm),
  })
})

app.get('/api/owner/parking-areas', authRequired, requireRole('owner'), async (req, res) => {
  const now = new Date().toISOString()
  const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const result = await req.db.query(
    'SELECT * FROM parking_areas WHERE owner_id = $1 ORDER BY created_at DESC',
    [req.user.id]
  )

  const areas = await Promise.all(
    result.rows.map(async (row) => {
      const area = mapArea(row)
      return {
        ...area,
        availability: await getAreaAvailability(req.db, area, now, nextHour),
      }
    })
  )

  res.json({ areas })
})

app.post('/api/parking-areas', authRequired, requireRole('owner'), async (req, res) => {
  const {
    name,
    address,
    city,
    description,
    latitude,
    longitude,
    carSlots,
    bikeSlots,
    pricePerHour,
  } = req.body

  if (!name || !address || !city || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ message: 'Name, address, city, latitude, and longitude are required.' })
  }

  const area = {
    id: createId('area'),
    ownerId: req.user.id,
    name,
    address,
    city,
    description: description || '',
    latitude: Number(latitude),
    longitude: Number(longitude),
    carSlots: Number(carSlots || 0),
    bikeSlots: Number(bikeSlots || 0),
    pricePerHour: Number(pricePerHour || 0),
    createdAt: new Date().toISOString(),
  }

  await req.db.query(
    `
      INSERT INTO parking_areas (
        id,
        owner_id,
        name,
        address,
        city,
        description,
        latitude,
        longitude,
        car_slots,
        bike_slots,
        price_per_hour,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `,
    [
      area.id,
      area.ownerId,
      area.name,
      area.address,
      area.city,
      area.description,
      area.latitude,
      area.longitude,
      area.carSlots,
      area.bikeSlots,
      area.pricePerHour,
      area.createdAt,
    ]
  )

  res.status(201).json({ area })
})

app.get('/api/reservations/me', authRequired, async (req, res) => {
  const baseQuery = `
    SELECT
      r.*,
      a.id AS area_id,
      a.owner_id AS area_owner_id,
      a.name AS area_name,
      a.address AS area_address,
      a.city AS area_city,
      a.description AS area_description,
      a.latitude AS area_latitude,
      a.longitude AS area_longitude,
      a.car_slots AS area_car_slots,
      a.bike_slots AS area_bike_slots,
      a.price_per_hour AS area_price_per_hour,
      a.created_at AS area_created_at
    FROM reservations r
    LEFT JOIN parking_areas a ON a.id = r.parking_area_id
  `

  const result =
    req.user.role === 'user'
      ? await req.db.query(
          `${baseQuery}
           WHERE r.user_id = $1
           ORDER BY r.created_at DESC`,
          [req.user.id]
        )
      : await req.db.query(
          `${baseQuery}
           WHERE a.owner_id = $1
           ORDER BY r.created_at DESC`,
          [req.user.id]
        )

  res.json({ reservations: result.rows.map(mapReservation) })
})

app.post('/api/reservations', authRequired, requireRole('user'), async (req, res) => {
  const { parkingAreaId, vehicleType, vehicleNumber, startTime, endTime } = req.body

  if (!parkingAreaId || !vehicleType || !vehicleNumber || !startTime || !endTime) {
    return res.status(400).json({ message: 'Parking area, vehicle details, and time range are required.' })
  }

  if (!['car', 'bike'].includes(vehicleType)) {
    return res.status(400).json({ message: 'Vehicle type must be car or bike.' })
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return res.status(400).json({ message: 'End time must be later than start time.' })
  }

  const areaResult = await req.db.query('SELECT * FROM parking_areas WHERE id = $1', [parkingAreaId])
  const areaRow = areaResult.rows[0]

  if (!areaRow) {
    return res.status(404).json({ message: 'Parking area not found.' })
  }

  const area = mapArea(areaRow)
  const availability = await getAreaAvailability(req.db, area, startTime, endTime)

  if (availability[vehicleType] <= 0) {
    return res.status(409).json({ message: `No ${vehicleType} slots are available for the selected time.` })
  }

  const durationHours = Math.max(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60),
    1
  )
  const amount = Math.ceil(durationHours * area.pricePerHour)
  const createdAt = new Date().toISOString()

  const reservation = {
    id: createId('reservation'),
    userId: req.user.id,
    parkingAreaId: area.id,
    vehicleType,
    vehicleNumber: vehicleNumber.toUpperCase(),
    startTime,
    endTime,
    durationHours: Number(durationHours.toFixed(2)),
    amount,
    status: 'confirmed',
    createdAt,
  }

  const payment = {
    id: createId('payment'),
    reservationId: reservation.id,
    amount,
    status: 'paid',
    method: 'demo_payment',
    payerName: req.user.name,
    maskedCardNumber: 'DEMO MODE',
    isDemo: true,
    createdAt,
  }

  const client = await req.db.connect()

  try {
    await client.query('BEGIN')

    await client.query(
      `
        INSERT INTO reservations (
          id,
          user_id,
          parking_area_id,
          vehicle_type,
          vehicle_number,
          start_time,
          end_time,
          duration_hours,
          amount,
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        reservation.id,
        reservation.userId,
        reservation.parkingAreaId,
        reservation.vehicleType,
        reservation.vehicleNumber,
        reservation.startTime,
        reservation.endTime,
        reservation.durationHours,
        reservation.amount,
        reservation.status,
        reservation.createdAt,
      ]
    )

    await client.query(
      `
        INSERT INTO payments (
          id,
          reservation_id,
          amount,
          status,
          method,
          payer_name,
          masked_card_number,
          is_demo,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        payment.id,
        payment.reservationId,
        payment.amount,
        payment.status,
        payment.method,
        payment.payerName,
        payment.maskedCardNumber,
        payment.isDemo,
        payment.createdAt,
      ]
    )

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  res.status(201).json({
    reservation,
    payment,
    message: 'Demo reservation confirmed successfully. No real payment was charged.',
  })
})

await initializeDatabase()

app.use(express.static(DIST_PATH))

app.get(/^(?!\/api).*/, async (_req, res) => {
  try {
    await fs.access(path.join(DIST_PATH, 'index.html'))
    return res.sendFile(path.join(DIST_PATH, 'index.html'))
  } catch {
    return res
      .status(200)
      .send('Parksphere PostgreSQL API is running. Build the frontend with "npm run build" to serve the app here.')
  }
})

app.listen(PORT, () => {
  console.log(`Parksphere server running on http://localhost:${PORT}`)
})
