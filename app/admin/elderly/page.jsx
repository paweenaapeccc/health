'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const genderLabel = (g) => (g === 'male' ? 'ชาย' : g === 'female' ? 'หญิง' : 'ไม่ระบุ')

const fmtDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' }).format(dt)
  } catch {
    return '-'
  }
}

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return children
}

export default function AdminElderlyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ show: false, title: '', message: '', onConfirm: null })

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize])

  // โหลดข้อมูล
  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/elderly?search=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok && (json.ok ?? true)) {
        const data = Array.isArray(json) ? json : json.data
        setRows(data || [])
        setTotal((Array.isArray(json) ? data?.length : json.total) ?? 0)
      } else {
        setRows([])
        setTotal(0)
      }
    } catch {
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const onSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  // ✅ Modal Confirm ตรงกลาง
  const showConfirm = (title, message, onConfirm) => {
    setModal({ show: true, title, message, onConfirm })
  }

  const handleDelete = async (id, name) => {
    showConfirm(
      'ยืนยันการลบข้อมูล',
      `ต้องการลบข้อมูลของ "${name}" หรือไม่?`,
      async () => {
        try {
          const res = await fetch(`/api/elderly/${id}`, { method: 'DELETE' })
          const json = await res.json()
          if (res.ok && json.ok) {
            setModal({
              show: true,
              title: 'สำเร็จ',
              message: 'ลบข้อมูลสำเร็จ',
              onConfirm: () => setModal({ show: false }),
            })
            load()
          } else {
            setModal({
              show: true,
              title: 'เกิดข้อผิดพลาด',
              message: json.error || 'ลบข้อมูลไม่สำเร็จ',
              onConfirm: () => setModal({ show: false }),
            })
          }
        } catch (e) {
          console.error(e)
          setModal({
            show: true,
            title: 'ข้อผิดพลาด',
            message: 'เกิดข้อผิดพลาดในการลบข้อมูล',
            onConfirm: () => setModal({ show: false }),
          })
        }
      }
    )
  }

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* ✅ Modal Center Confirm */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md mx-4 text-center space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{modal.title}</h2>
            <p className="text-gray-600 dark:text-gray-300">{modal.message}</p>
            <div className="flex justify-center gap-4 pt-2">
              {modal.onConfirm && modal.title === 'ยืนยันการลบข้อมูล' ? (
                <>
                  <button
                    onClick={() => {
                      setModal({ show: false })
                      modal.onConfirm()
                    }}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                  >
                    ตกลง
                  </button>
                  <button
                    onClick={() => setModal({ show: false })}
                    className="px-5 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setModal({ show: false })}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔹 ตารางหลัก */}
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">ข้อมูลผู้สูงอายุ (Admin)</h1>
          <Link
            href="/admin/elderly/add"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            + เพิ่มข้อมูล
          </Link>
        </div>

        {/* Search */}
        <ClientOnly>
          <form
            onSubmit={onSearch}
            className="flex flex-col sm:flex-row gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / เบอร์ / บัตร / ที่อยู่"
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow cursor-pointer"
            >
              ค้นหา
            </button>
          </form>
        </ClientOnly>

        {/* Table */}
        <div className="overflow-auto rounded-xl border border-gray-200">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left w-20">รหัส</th>
                <th className="p-3 text-left">ชื่อ-สกุล</th>
                <th className="p-3 text-left">เพศ</th>
                <th className="p-3 text-left">วันเกิด</th>
                <th className="p-3 text-left">อายุ</th>
                <th className="p-3 text-left">โทร</th>
                <th className="p-3 text-left">ที่อยู่</th>
                <th className="p-3 text-left">ตำบล/อำเภอ/จังหวัด</th>
                <th className="p-3 text-center w-32"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => {
                  const id = r.id ?? r.elderlyID
                  const name = r.name ?? r.fullName
                  const phone = r.phonNumber ?? r.phoneNumber ?? r.phone ?? '-'
                  return (
                    <tr key={id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-3">{id}</td>
                      <td className="p-3">{name}</td>
                      <td className="p-3">{genderLabel(r.gender)}</td>
                      <td className="p-3">{fmtDate(r.birthDate)}</td>
                      <td className="p-3">{r.ageYears ?? '-'}</td>
                      <td className="p-3">{phone}</td>
                      <td className="p-3">{r.address || '-'}</td>
                      <td className="p-3">
                        {[r.subdistrict, r.district, r.province].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/admin/elderly/${id}/edit`}
                            className="px-3 py-1.5 rounded-lg bg-yellow-400 text-white hover:bg-yellow-500 text-xs shadow"
                          >
                            แก้ไข
                          </Link>
                          <button
                            onClick={() => handleDelete(id, name)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 text-xs shadow cursor-pointer"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-gray-600">รวม {total} รายการ</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100 transition cursor-pointer"
              type="button"
            >
              ก่อนหน้า
            </button>
            <span className="text-gray-700">
              หน้า {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-100 transition cursor-pointer"
              type="button"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
