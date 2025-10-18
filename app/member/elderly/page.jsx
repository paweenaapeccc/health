'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

/* ------------------------------------------------------------
   🔹 เพศ: ชาย / หญิง เท่านั้น
------------------------------------------------------------ */
const genderLabel = (g) => {
  if (g === 'male') return 'ชาย'
  if (g === 'female') return 'หญิง'
  return '-'
}

/* ------------------------------------------------------------
   🔹 ฟอร์แมตรูปแบบวันที่เป็นไทย
------------------------------------------------------------ */
const fmtDate = (d) => {
  if (!d) return '-'
  try {
    const dt = new Date(d)
    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok',
      dateStyle: 'medium',
    }).format(dt)
  } catch {
    return '-'
  }
}

/* ------------------------------------------------------------
   🔹 แสดงผลเฉพาะเมื่อ Client mount แล้ว
------------------------------------------------------------ */
function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return children
}

/* ------------------------------------------------------------
   🔹 หน้ารายการข้อมูลผู้สูงอายุ (แสดงเฉพาะเลขบัตร + ชื่อ)
------------------------------------------------------------ */
export default function MemberElderlyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [selected, setSelected] = useState(null) // ✅ modal ข้อมูล

  /* ----------------------------------------------------------
     🔹 คำนวณจำนวนหน้าทั้งหมด
  ---------------------------------------------------------- */
  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / pageSize), 1),
    [total, pageSize]
  )

  /* ----------------------------------------------------------
     🔹 โหลดข้อมูลจาก API
  ---------------------------------------------------------- */
  const load = async (searchText = q, pageNum = page) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/elderly?search=${encodeURIComponent(searchText)}&page=${pageNum}&pageSize=${pageSize}`,
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

  /* ----------------------------------------------------------
     🔹 โหลดข้อมูลเมื่อเปิดหน้า
  ---------------------------------------------------------- */
  useEffect(() => {
    load()
  }, [page])

  /* ----------------------------------------------------------
     🔹 ระบบค้นหาอัตโนมัติ (Debounce)
  ---------------------------------------------------------- */
  useEffect(() => {
    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => {
      setPage(1)
      load(q, 1)
    }, 0)
    setTypingTimeout(timeout)
    return () => clearTimeout(timeout)
  }, [q])

  /* ----------------------------------------------------------
     🔹 คำนวณอายุจากวันเกิด
  ---------------------------------------------------------- */
  const calcAge = (birthDate) => {
    if (!birthDate) return '-'
    const birth = new Date(birthDate)
    if (isNaN(birth)) return '-'
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  /* ----------------------------------------------------------
     🔹 เปิด / ปิด modal
  ---------------------------------------------------------- */
  const handleOpen = (r) => setSelected(r)
  const closeModal = () => setSelected(null)

  /* ----------------------------------------------------------
     🔹 ส่วนแสดงผลหลัก
  ---------------------------------------------------------- */
  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-2xl space-y-8">

      {/* ---------------- Header ---------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-800">
          ข้อมูลผู้สูงอายุ
        </h1>
        <Link
          href="/member/elderly/add"
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มข้อมูล
        </Link>
      </div>

      {/* ---------------- Search ---------------- */}
      <ClientOnly>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="พิมพ์เลขบัตรประชาชนหรือชื่อเพื่อค้นหา..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          <button
            onClick={() => { setPage(1); load(); }}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow"
            type="button"
          >
            ค้นหา
          </button>
        </div>
      </ClientOnly>

      {/* ---------------- Table ---------------- */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="min-w-full text-base text-gray-800">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">เลขบัตรประชาชน</th>
              <th className="p-3 text-left">ชื่อ-สกุล</th>
              <th className="p-3 text-center w-48"></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  กำลังโหลด…
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}

            {!loading && rows.map((r) => {
              const id = r.id ?? r.elderlyID
              const name = r.name ?? r.fullName

              return (
                <tr key={id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{r.citizenID ?? '-'}</td>
                  <td className="p-3">{name}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpen(r)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-md"
                    >
                      ข้อมูลสุขภาพ
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ---------------- Pagination ---------------- */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-gray-700">รวม {total} รายการ</div>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
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
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
            type="button"
          >
            ถัดไป
          </button>
        </div>
      </div>

      {/* ---------------- Modal (รายละเอียด) ---------------- */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 space-y-4 relative">
            <h2 className="text-2xl font-bold text-center text-emerald-600">
              ข้อมูลสุขภาพผู้สูงอายุ
            </h2>

            <div className="space-y-2 text-gray-800 text-lg">
              {/* <p><b>ชื่อ:</b> {selected.name ?? '-'}</p>
              <p><b>เพศ:</b> {genderLabel(selected.gender)}</p>
              <p><b>วันเกิด:</b> {fmtDate(selected.birthDate)}</p>
              <p><b>อายุ:</b> {calcAge(selected.birthDate)} ปี</p>
              <p><b>เลขบัตรประชาชน:</b> {selected.citizenID ?? '-'}</p>
              <p><b>ที่อยู่:</b> {selected.address ?? '-'}</p>
              <p><b>ตำบล/อำเภอ/จังหวัด:</b> {[selected.subdistrict, selected.district, selected.province].filter(Boolean).join(' / ') || '-'}</p>
              <p><b>เบอร์โทร:</b> {selected.phoneNumber ?? selected.phonNumber ?? '-'}</p> */}
              <p><b>ส่วนสูง:</b> {selected.height ?? '-'}</p>
              <p><b>น้ำหนัก:</b> {selected.weight ?? '-'}</p>
              <p><b>โรคประจำตัว:</b> {selected.congenitalDisease ?? '-'}</p>
              <p><b>หมายเหตุ:</b> {selected.note ?? '-'}</p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition shadow"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
