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
  const [deletingId, setDeletingId] = useState(null)

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize])

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

  const handleDelete = async (id) => {
    if (!id) return
    const ok = window.confirm('ต้องการลบรายการนี้หรือไม่?')
    if (!ok) return
    try {
      setDeletingId(id)
      const res = await fetch(`/api/elderly/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'ลบไม่สำเร็จ')
        return
      }
      // ลบออกจาก state ทันที
      setRows((prev) => prev.filter((r) => (r.id ?? r.elderlyID) !== id))
      setTotal((t) => Math.max(0, t - 1))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ผู้สูงอายุ (Member)</h1>
          <Link
            href="/member/elderly/add"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition"
          >
            + เพิ่มข้อมูล
          </Link>
        </div>

        {/* Search */}
        <ClientOnly>
          <form onSubmit={onSearch} className="flex gap-3 mb-6 bg-white p-4 rounded-xl shadow">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / เบอร์ / บัตร / ที่อยู่"
              className="flex-1 min-w-[260px] border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <button className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow" type="submit">
              ค้นหา
            </button>
          </form>
        </ClientOnly>

        {/* Table */}
        <div className="overflow-auto rounded-xl bg-white shadow ring-1 ring-gray-200">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3 text-left w-20">รหัส</th>
                <th className="p-3 text-left">ชื่อ-สกุล</th>
                <th className="p-3 text-left">เพศ</th>
                <th className="p-3 text-left">วันเกิด</th>
                <th className="p-3 text-left">อายุ</th>
                <th className="p-3 text-left">โทร</th>
                <th className="p-3 text-left">ที่อยู่</th>
                <th className="p-3 text-left">ตำบล/อำเภอ/จังหวัด</th>
                <th className="p-3 text-left w-40">การทำงาน</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">กำลังโหลด…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">ไม่พบข้อมูล</td>
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
                      <td className="p-3">{phone || '-'}</td>
                      <td className="p-3">{r.address || '-'}</td>
                      <td className="p-3">
                        {[r.subdistrict, r.district, r.province].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/member/elderly/${encodeURIComponent(id)}/edit`}
                            className="px-3 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
                          >
                            แก้ไข
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(id)}
                            disabled={deletingId === id}
                            className="px-3 py-1.5 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                          >
                            {deletingId === id ? 'กำลังลบ…' : 'ลบ'}
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
        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-xl shadow">
          <div className="text-gray-600">รวม {total} รายการ</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              type="button"
            >
              ก่อนหน้า
            </button>
            <span className="text-gray-700">หน้า {page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
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
