'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')

    console.log('token:', token)       // ดีบัก
    console.log('role:', storedRole)   // ดีบัก

    // แก้เงื่อนไข ให้เช็คว่าต้องมี token และ role เป็น 'user'
    if (token && storedRole === 'user') {
      setRole('user')
    } else {
      setRole(null)
    }

    async function fetchHealthInfo() {
      try {
        const res = await fetch('/api/healthinfo')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData([])
        }
      } catch (error) {
        console.error('Failed to fetch health info:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHealthInfo()
  }, [])

  return (
    <div>
      <main className="flex-grow flex justify-center items-start px-4 py-12">
        <div className="w-full max-w-4xl space-y-10">

          {/* แสดงข้อมูลสุขภาพ */}
          {loading && <p className="text-center">กำลังโหลดข้อมูล...</p>}

          {!loading && data && data.length > 0 && (
            <div className="space-y-6">
              {data.map(({ id, title, content, updated_at }) => (
                <article key={id} className="p-6 bg-white rounded shadow">
                  <h2 className="text-2xl font-semibold text-teal-700">{title}</h2>
                  <p className="text-gray-700">{content}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    อัปเดตเมื่อ: {new Date(updated_at).toLocaleString('th-TH')}
                  </p>
                </article>
              ))}
            </div>
          )}

          {!loading && (!data || data.length === 0) && (
            <p className="text-center text-gray-500">ไม่มีข้อมูล</p>
          )}
        </div>
      </main>
    </div>
  )
}
