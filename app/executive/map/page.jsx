'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// ✅ โหลด LeafletMap แบบ dynamic (ปิด SSR)
const LeafletMap = dynamic(() => import('./LeafletMap.jsx'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[80vh] text-gray-600 text-lg">
      🗺️ กำลังโหลดแผนที่...
    </div>
  ),
})

export default function ExecutiveMapPage() {
  const [elderlyList, setElderlyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ✅ โหลดข้อมูลผู้สูงอายุจาก API
  useEffect(() => {
    const fetchElderly = async () => {
      try {
        const res = await fetch('/api/elderly', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'ไม่สามารถโหลดข้อมูลได้')
        setElderlyList(data.data || [])
      } catch (err) {
        console.error('โหลดข้อมูลผู้สูงอายุผิดพลาด:', err)
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
      } finally {
        setLoading(false)
      }
    }
    fetchElderly()
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700 text-xl">
        ⏳ กำลังโหลดข้อมูลผู้สูงอายุ...
      </div>
    )

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600 text-xl">
        {error}
      </div>
    )

  return (
    <main className="min-h-screen mt-16">
      {/* ↑ เพิ่ม mt-16 ให้ห่าง navbar */}
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            🗺️ แผนที่แสดงตำแหน่งผู้สูงอายุในพื้นที่
          </h1>
        </header>

        {/* ✅ กล่องแผนที่ */}
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-blue-300">
          {Array.isArray(elderlyList) && elderlyList.length > 0 ? (
            <LeafletMap elderlyList={elderlyList} />
          ) : (
            <div className="flex items-center justify-center h-[80vh] text-gray-600 text-lg">
              ไม่พบข้อมูลผู้สูงอายุในระบบ
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
