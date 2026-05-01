import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function ParkingMap({
  userLocation,
  parkingAreas,
  height = 420,
  selectedAreaId,
  onSelectArea,
}) {
  const defaultCenter =
    userLocation || (parkingAreas[0] ? [parkingAreas[0].latitude, parkingAreas[0].longitude] : [28.6315, 77.2167])

  function MapFocusController() {
    const map = useMap()

    useEffect(() => {
      if (userLocation) {
        map.flyTo(userLocation, Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 1.2,
        })
        return
      }

      if (parkingAreas[0]) {
        map.flyTo([parkingAreas[0].latitude, parkingAreas[0].longitude], map.getZoom(), {
          animate: true,
          duration: 1,
        })
      }
    }, [map, parkingAreas, userLocation])

    return null
  }

  return (
    <div className="map-shell" style={{ height }}>
      <MapContainer center={defaultCenter} zoom={14} scrollWheelZoom className="parking-map">
        <MapFocusController />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation ? (
          <>
            <Marker position={userLocation}>
              <Popup>Your current location</Popup>
            </Marker>
            <Circle center={userLocation} radius={3000} pathOptions={{ color: '#68f5ff', fillOpacity: 0.08 }} />
          </>
        ) : null}

        {parkingAreas.map((area) => (
          <Marker
            key={area.id}
            position={[area.latitude, area.longitude]}
            eventHandlers={{
              click: () => onSelectArea?.(area),
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{area.name}</strong>
                <span>{area.address}</span>
                <span>
                  Car: {area.availability?.car ?? area.carSlots} | Bike: {area.availability?.bike ?? area.bikeSlots}
                </span>
                {area.distanceKm !== undefined ? <span>{area.distanceKm} km away</span> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedAreaId ? <div className="map-status">Selected parking area highlighted in your booking panel.</div> : null}
    </div>
  )
}
