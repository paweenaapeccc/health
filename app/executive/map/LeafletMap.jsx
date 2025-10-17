'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import polyline from '@mapbox/polyline'
import 'leaflet/dist/leaflet.css'

// ✅ ตั้งค่า default marker
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ✅ พิกัดโรงพยาบาล
const HOSPITAL_LATLNG = [14.921958636767206, 103.30063774292132]
const hospitalIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
})

export default function LeafletMap({ elderlyList = [] }) {
  const [routeCoords, setRouteCoords] = useState([])
  const [distance, setDistance] = useState(0)
  const [duration, setDuration] = useState(0)
  const [routeVisible, setRouteVisible] = useState(false)
  const mapRef = useRef(null)

  // ✅ รีเฟรชแผนที่เวลา resize
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    setTimeout(() => map.invalidateSize(), 300)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ✅ ดึงเส้นทางจาก API
  const fetchRoute = async (start, end, markerRef) => {
    try {
      const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          Authorization:
            'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlZjk1MjkyOWFiMjRlMGI4YjBiYjQ2M2IwMmU4NGE0IiwiaCI6Im11cm11cjY0In0=',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [start[1], start[0]],
            [end[1], end[0]],
          ],
        }),
      })
      const data = await res.json()
      const route = data?.routes?.[0]
      if (route?.geometry) {
        const decoded = polyline.decode(route.geometry)
        setRouteCoords(decoded)
        setRouteVisible(true)
        setDistance((route.summary.distance / 1000).toFixed(2))
        setDuration((route.summary.duration / 60).toFixed(1))

        const map = mapRef.current
        if (map) {
          setTimeout(() => {
            map.fitBounds(decoded, { padding: [40, 40] })
            map.invalidateSize()
          }, 100)
        }

        // ✅ เปิด popup ทันที
        if (markerRef?.current) markerRef.current.openPopup()
      } else {
        alert('❌ ไม่พบเส้นทางจาก OpenRouteService')
      }
    } catch (e) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการดึงเส้นทาง')
    }
  }

  const clearRoute = () => {
    setRouteCoords([])
    setDistance(0)
    setDuration(0)
    setRouteVisible(false)
  }

  return (
    <div className="relative w-full h-[calc(100vh-150px)]">
      <div key="map" className="h-full w-full z-0">
        <MapContainer
          center={[15.0, 103.1]}
          zoom={11}
          className="h-full w-full z-0"
          whenCreated={(map) => {
            mapRef.current = map
            setTimeout(() => map.invalidateSize(), 300)
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ✅ Marker โรงพยาบาล */}
          <Marker position={HOSPITAL_LATLNG} icon={hospitalIcon}>
            <Popup>🏥 <b>โรงพยาบาลกระสัง</b></Popup>
          </Marker>

          {/* ✅ Marker ผู้สูงอายุ */}
          {Array.isArray(elderlyList) &&
            elderlyList.map((e) => {
              if (!e?.latlong) return null
              const [lat, lng] = e.latlong.split(',').map(Number)
              if (isNaN(lat) || isNaN(lng)) return null
              const markerRef = useRef(null)

              return (
                <Marker key={e.id} position={[lat, lng]} ref={markerRef}>
                  <Popup>
                    <div className="space-y-2">
                      <p>
                        <b>ชื่อ:</b> {e.name}<br />
                        <b>อายุ:</b> {e.age} ปี<br />
                        <b>เพศ:</b> {e.gender}<br />
                        <b>ที่อยู่:</b> {e.address}
                      </p>

                      <p className="mt-2 font-semibold bg-gray-100 border border-gray-300 rounded-lg px-3 py-1">
                        {e.assessment_result
                          ? <>🩺 ผลการประเมิน: {e.assessment_result}</>
                          : <>⚠️ ยังไม่ได้ทำแบบประเมิน</>}
                      </p>

                      <button
                        onClick={() => fetchRoute([lat, lng], HOSPITAL_LATLNG, markerRef)}
                        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md"
                      >
                        🚗 เส้นทางไปโรงพยาบาลกระสัง
                      </button>

                      <button
                        onClick={() => {
                          // ✅ เปิด popup ก่อนเปิด Google Maps
                          if (markerRef.current) markerRef.current.openPopup()
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${HOSPITAL_LATLNG[0]},${HOSPITAL_LATLNG[1]}&travelmode=driving`,
                            '_blank'
                          )
                        }}
                        className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md"
                      >
                        🧭 เปิดนำทางใน Google Maps
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            })}

          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="deepskyblue" weight={6} />
          )}

          {routeVisible && (
            <>
              <MapButton onClear={clearRoute} />
              <MapInfo distance={distance} duration={duration} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  )
}

// ✅ ปุ่มล้างเส้นทาง
function MapButton({ onClear }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return (
    <div
      className="leaflet-top leaflet-left z-[1001]"
      style={{ marginTop: '20px', marginLeft: '50px' }}
    >
      <div className="leaflet-control bg-white shadow-md rounded-md">
        <button
          onClick={onClear}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md"
        >
          ล้างเส้นทาง
        </button>
      </div>
    </div>
  )
}

// ✅ กล่องข้อมูลระยะทาง/เวลา
function MapInfo({ distance, duration }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
  }, [map])
  return (
    <div
      className="leaflet-top leaflet-right z-[1001]"
      style={{ marginTop: '20px', marginRight: '15px' }}
    >
      <div className="leaflet-control bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg shadow-md px-4 py-2">
        <p className="text-gray-800 font-semibold text-sm">
          📏 ระยะทาง: <span className="text-blue-700">{distance} กม.</span><br />
          ⏱ เวลาโดยประมาณ: <span className="text-green-700">{duration} นาที</span>
        </p>
      </div>
    </div>
  )
}
