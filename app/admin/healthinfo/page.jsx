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

    if (token && storedRole) {
      setRole(storedRole)   // เก็บ role ที่เจอไว้
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

  const handleEdit = (id) => {
    // 👉 ไปหน้าแก้ไข (เช่น /admin/healthinfo/[id])
    router.push(`/admin/healthinfo/${id}/edit`)
  }

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
                  <p className="text-gray-700 whitespace-pre-line">{content}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    อัปเดตเมื่อ: {new Date(updated_at).toLocaleString('th-TH')}
                  </p>

                  {/* ปุ่มแก้ไข: แสดงเฉพาะ role admin/editor */}
                  {role === 'admin' || role === 'editor' ? (
                    <div className="mt-4">
                      <button
                        onClick={() => handleEdit(id)}
                        className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-medium"
                      >
                        แก้ไข
                      </button>
                    </div>
                  ) : null}
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
