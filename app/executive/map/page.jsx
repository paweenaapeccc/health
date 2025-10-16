'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// ✅ โหลด map component แบบ client เท่านั้น
const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false })

export default function MapPage() {
  const [mounted, setMounted] = useState(false)
  const [elderlyList, setElderlyList] = useState([])
  const routeRef = useRef(null)
  const mapRef = useRef(null)

  const hospitalLatLng = [14.921958636767206, 103.30063774292132]
  const apiKey =
    'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlZjk1MjkyOWFiMjRlMGI4YjBiYjQ2M2IwMmU4NGE0IiwiaCI6Im11cm11cjY0In0='

  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ โหลดข้อมูลผู้สูงอายุ
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/elderly', { cache: 'no-store' })
        const json = await res.json()
        setElderlyList(Array.isArray(json.data) ? json.data : [])
      } catch (err) {
        console.error('โหลดข้อมูลล้มเหลว:', err)
      }
    }
    load()
  }, [])

  // ✅ ฟังก์ชันเรียกเส้นทาง
  const drawRoute = async (lat, lng, name) => {
    console.log('🚀 เริ่มดึงเส้นทางจาก:', lat, lng, name)
    const L = (await import('leaflet')).default
    if (!mapRef.current) {
      console.warn('❌ ไม่มี mapRef.current')
      return
    }

    const map = mapRef.current
    if (routeRef.current) {
      map.removeLayer(routeRef.current)
      routeRef.current = null
    }

    try {
      const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [lng, lat],
            [hospitalLatLng[1], hospitalLatLng[0]],
          ],
        }),
      })

      console.log('📡 เรียก API:', res.status)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const dist = (data.routes[0].summary.distance / 1000).toFixed(2)
      const time = (data.routes[0].summary.duration / 60).toFixed(1)

      const line = L.polyline(coords, { color: 'blue', weight: 5 }).addTo(map)
      routeRef.current = line
      map.fitBounds(line.getBounds())

      L.popup()
        .setLatLng(coords[Math.floor(coords.length / 2)])
        .setContent(`
          <div style="font-size:14px;">
            🚗 <b>เส้นทางจาก ${name}</b><br/>
            🏥 ไปโรงพยาบาลกระสัง<br/>
            📏 ระยะทาง ${dist} กม.<br/>
            ⏱ เวลาโดยประมาณ ${time} นาที
          </div>
        `)
        .openOn(map)
    } catch (err) {
      console.error('❌ Route error:', err)
      alert('ไม่สามารถดึงเส้นทางจาก OpenRouteService ได้')
    }
  }

  if (!mounted) return <p className='text-center p-10 text-gray-500'>กำลังโหลดแผนที่...</p>

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6'>
      <h1 className='text-3xl font-bold text-center text-gray-800 mb-4'>
        แผนที่แสดงข้อมูลผู้สูงอายุในพื้นที่
      </h1>

      <div className='border border-gray-300 rounded-xl shadow-lg overflow-hidden'>
        <LeafletMap elderlyList={elderlyList} onClickRoute={drawRoute} />
      </div>
    </div>
  )
}
