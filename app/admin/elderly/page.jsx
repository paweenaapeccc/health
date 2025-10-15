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

export default function MemberElderlyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ show: false, id: null, name: '' }) // 🟢 state modal

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize])

  // โหลดข้อมูล
  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/elderly?search=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`,
        { cache: 'no-store' }
      )
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

  // เปิด modal ลบข้อมูล
  const confirmDelete = (id, name) => {
    setModal({ show: true, id, name })
  }

  // ดำเนินการลบ
  const handleDelete = async () => {
    const { id, name } = modal
    try {
      const res = await fetch(`/api/elderly/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.ok) {
        setModal({ show: false, id: null, name: '' })
        alert(`ลบข้อมูล "${name}" สำเร็จ`)
        load()
      } else {
        alert(json.error || 'ลบข้อมูลไม่สำเร็จ')
      }
    } catch (e) {
      console.error(e)
      alert('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">ข้อมูลผู้สูงอายุ (Member)</h1>
          <Link
            href="/member/elderly/add"
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
                            onClick={() => confirmDelete(id, name)}
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

      {/* 🟢 Modal Confirm Delete */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-md text-center transform transition-all scale-100">
            <h2 className="text-lg font-semibold text-gray-800">
              ต้องการลบข้อมูลของ <span className="text-red-600">"{modal.name}"</span> หรือไม่?
            </h2>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                ลบ
              </button>
              <button
                onClick={() => setModal({ show: false, id: null, name: '' })}
                className="px-5 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
