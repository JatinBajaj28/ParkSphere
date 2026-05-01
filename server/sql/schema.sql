CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'owner')),
  phone TEXT DEFAULT '',
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS parking_areas (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  car_slots INTEGER NOT NULL DEFAULT 0 CHECK (car_slots >= 0),
  bike_slots INTEGER NOT NULL DEFAULT 0 CHECK (bike_slots >= 0),
  price_per_hour DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (price_per_hour >= 0),
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  parking_area_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
  vehicle_number TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_hours DOUBLE PRECISION NOT NULL CHECK (duration_hours > 0),
  amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_area_id) REFERENCES parking_areas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL UNIQUE,
  amount DOUBLE PRECISION NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'paid',
  method TEXT NOT NULL,
  payer_name TEXT NOT NULL,
  masked_card_number TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_parking_areas_owner ON parking_areas(owner_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_area_time ON reservations(parking_area_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
