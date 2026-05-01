const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong while contacting the server.')
  }

  return data
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),
  getParkingAreas: (query = '') => request(`/parking-areas?q=${encodeURIComponent(query)}`),
  getNearbyParking: ({ lat, lng, radiusKm = 3 }) =>
    request(`/parking-areas/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`),
  getOwnerAreas: (token) => request('/owner/parking-areas', { token }),
  createParkingArea: (token, payload) =>
    request('/parking-areas', { method: 'POST', token, body: payload }),
  getMyReservations: (token) => request('/reservations/me', { token }),
  createReservation: (token, payload) =>
    request('/reservations', { method: 'POST', token, body: payload }),
}
