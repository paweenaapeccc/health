'use client'

import { useEffect, useMemo, useState, useTransition, Suspense, useRef } from 'react'
import Link from 'next/link'

const genderLabel = (g) => (g === 'male' ? 'ชาย' : g === 'female' ? 'หญิง' : '-')
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

export default function MemberElderlyPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [isPending, startTransition] = useTransition()
  const controllerRef = useRef(null)
  const cacheRef = useRef(new Map())

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize])

  /* ----------------------------------------
     ✅ โหลดข้อมูล (พร้อม cache และ cancel request)
  ---------------------------------------- */
  const load = async (searchText = q, pageNum = page) => {
    setLoading(true)
    try {
      const cacheKey = `${searchText}-${pageNum}`
      if (cacheRef.current.has(cacheKey)) {
        startTransition(() => {
          const cached = cacheRef.current.get(cacheKey)
          setRows(cached.rows)
          setTotal(cached.total)
          setLoading(false)
        })
        return
      }

      if (controllerRef.current) controllerRef.current.abort()
      controllerRef.current = new AbortController()

      const res = await fetch(
        `/api/elderly?search=${encodeURIComponent(searchText)}&page=${pageNum}&pageSize=${pageSize}`,
        {
          signal: controllerRef.current.signal,
          cache: 'force-cache',
          next: { revalidate: 15 },
        }
      )

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const data = Array.isArray(json) ? json : json.data
      const totalRows = json.total ?? data.length ?? 0

      startTransition(() => {
        setRows(data || [])
        setTotal(totalRows)
        cacheRef.current.set(cacheKey, { rows: data, total: totalRows })
      })
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  /* ----------------------------------------
     ✅ ระบบค้นหา (Debounce + cancel request)
  ---------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      load(q, 1)
    }, 400)
    return () => clearTimeout(timer)
  }, [q])

  /* ----------------------------------------
     ✅ Skeleton
  ---------------------------------------- */
  const SkeletonRow = () => (
    <tr className="animate-pulse text-gray-400">
      <td colSpan={7} className="p-3 text-center">
        กำลังโหลดข้อมูล...
      </td>
    </tr>
  )

  /* ----------------------------------------
     ✅ แปลงค่าพฤติกรรมสุขภาพเป็นภาษาไทย
  ---------------------------------------- */
  const translateHealthValue = (key, value) => {
    if (!value) return '-'

    const maps = {
      exerciseFrequency: {
        daily: 'ทุกวัน',
        '3-5': '3-5 ครั้ง/สัปดาห์',
        '1-2': '1-2 ครั้ง/สัปดาห์',
        rarely: 'ไม่ค่อยออกกำลังกาย',
      },
      foodHabit: {
        healthy: 'ทานอาหารครบ 5 หมู่',
        highfat: 'ชอบอาหารมัน / เค็ม',
        sweet: 'ทานหวานจัด',
        irregular: 'ไม่เป็นเวลา',
      },
      smoking: {
        no: 'ไม่สูบ',
        quit: 'เลิกแล้ว',
        yes: 'สูบเป็นประจำ',
      },
      alcohol: {
        no: 'ไม่ดื่ม',
        occasionally: 'ดื่มบางโอกาส',
        regular: 'ดื่มเป็นประจำ',
      },
    }

    return maps[key]?.[value] ?? value
  }

  /* ----------------------------------------
     ✅ ส่วนแสดงผลหลัก
  ---------------------------------------- */
  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-3xl shadow-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-800">ข้อมูลผู้สูงอายุ</h1>
        <Link
          href="/member/elderly/add"
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 transition"
        >
          + เพิ่มข้อมูล
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="พิมพ์เลขบัตรประชาชนหรือชื่อเพื่อค้นหา..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoComplete="off"
        />
        <button
          onClick={() => {
            setPage(1)
            load()
          }}
          className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow"
          type="button"
        >
          {loading || isPending ? 'กำลังโหลด...' : 'ค้นหา'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl">
        <table className="min-w-full text-base text-gray-800">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">เลขบัตรประชาชน</th>
              <th className="p-3 text-left">ชื่อ-สกุล</th>
              <th className="p-3 text-center">อายุ</th>
              <th className="p-3 text-left">วันเกิด</th>
              <th className="p-3 text-left">ที่อยู่</th>
              <th className="p-3 text-left">เบอร์โทร</th>
              <th className="p-3 text-center w-48"></th>
            </tr>
          </thead>
          <tbody>
            <Suspense fallback={<SkeletonRow />}>
              {loading ? (
                <SkeletonRow />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const id = r.id ?? r.elderlyID
                  const name = r.name ?? r.fullName
                  return (
                    <tr key={id} className="border-t hover:bg-gray-50 transition">
                      <td className="p-3">{r.citizenID ?? '-'}</td>
                      <td className="p-3">{name}</td>
                      <td className="p-3 text-center">{r.age ?? '-'}</td>
                      <td className="p-3">{fmtDate(r.birthDate || r.birthdate)}</td>
                      <td className="p-3">{r.address ?? '-'}</td>
                      <td className="p-3">{r.phonNumber || r.phone || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelected(r)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition shadow-md"
                        >
                          ข้อมูลสุขภาพ
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </Suspense>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-gray-700">รวม {total} รายการ</div>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
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
          >
            ถัดไป
          </button>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 space-y-4 relative">
            <h2 className="text-2xl font-bold text-center text-emerald-600">
              ข้อมูลสุขภาพผู้สูงอายุ
            </h2>
            <div className="space-y-2 text-gray-800 text-lg">
              <p><b>ส่วนสูง:</b> {selected.height ?? '-'}</p>
              <p><b>น้ำหนัก:</b> {selected.weight ?? '-'}</p>
              <p><b>โรคประจำตัว:</b> {selected.congenitalDisease ?? '-'}</p>
              <p><b>หมายเหตุ:</b> {selected.note ?? '-'}</p>
              <p>
                <b>ความถี่ในการออกกำลังกาย:</b>{' '}
                {translateHealthValue('exerciseFrequency', selected.exerciseFrequency)}
              </p>
              <p>
                <b>พฤติกรรมการบริโภคอาหาร:</b>{' '}
                {translateHealthValue('foodHabit', selected.foodHabit)}
              </p>
              <p>
                <b>การสูบบุหรี่:</b>{' '}
                {translateHealthValue('smoking', selected.smoking)}
              </p>
              <p>
                <b>การดื่มแอลกอฮอล์:</b>{' '}
                {translateHealthValue('alcohol', selected.alcohol)}
              </p>
            </div>
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setSelected(null)}
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
