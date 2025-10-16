'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditElderlyPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState({ show: false, text: '', success: false })

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    citizenID: '',
    birthDate: '',
    gender: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    latitude: '',
    longitude: ''
  })

  /* ------------------------------------------------------------
     ✅ แปลงวันที่ ค.ศ. → พ.ศ.
  ------------------------------------------------------------ */
  const toThaiDate = (isoDate) => {
    if (!isoDate) return ''
    const d = new Date(isoDate)
    const year = d.getFullYear() + 543
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${day}/${month}/${year}`
  }

  /* ------------------------------------------------------------
     ✅ แปลงวันที่ พ.ศ. → ค.ศ.
     รองรับรูปแบบเช่น 01/01/2500 หรือ 1-1-2500
  ------------------------------------------------------------ */
  const toChristianDate = (thaiDate) => {
    if (!thaiDate) return ''
    const match = thaiDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (!match) return ''
    const [_, day, month, yearThai] = match
    const yearAD = parseInt(yearThai) - 543
    return `${yearAD}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  /* ------------------------------------------------------------
     ✅ โหลดข้อมูลผู้สูงอายุเดิม
  ------------------------------------------------------------ */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/elderly/${id}`)
        if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ')
        const data = await res.json()

        setFormData({
          name: data.name ?? '',
          phoneNumber: data.phoneNumber ?? data.phonNumber ?? '',
          citizenID: data.citizenID ?? '',
          birthDate: data.birthDate ? toThaiDate(data.birthDate.slice(0, 10)) : '',
          gender: data.gender ?? '',
          address: data.address ?? '',
          subdistrict: data.subdistrict ?? '',
          district: data.district ?? '',
          province: data.province ?? '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? ''
        })
      } catch {
        setModal({ show: true, text: 'ไม่สามารถโหลดข้อมูลได้ ❌', success: false })
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  /* ------------------------------------------------------------
     ✅ ฟังก์ชัน handleChange
  ------------------------------------------------------------ */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  /* ------------------------------------------------------------
     ✅ ฟังก์ชัน handleSubmit (PUT → /api/elderly/:id)
  ------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/elderly/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phoneNumber,
          birthDate: toChristianDate(formData.birthDate)
        })
      })

      if (res.ok) {
        setModal({ show: true, text: '✅ อัปเดตข้อมูลสำเร็จ', success: true })
      } else {
        const data = await res.json().catch(() => ({}))
        setModal({ show: true, text: data?.error || 'เกิดข้อผิดพลาด ❌', success: false })
      }
    } catch {
      setModal({ show: true, text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ❌', success: false })
    } finally {
      setTimeout(() => {
        setSubmitting(false)
      }, 1000)
    }
  }

  /* ------------------------------------------------------------
     ✅ Loading state
  ------------------------------------------------------------ */
  if (loading) return <div className="p-6 text-center">⏳ กำลังโหลดข้อมูล…</div>

  /* ------------------------------------------------------------
     ✅ UI สไตล์ Tailwind
  ------------------------------------------------------------ */
  const label = 'text-sm font-medium text-slate-700'
  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'

  return (
    <div>
      {/* ✅ Modal แจ้งเตือนตรงกลางดีไซน์ใหม่ */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4 border border-gray-200">
            {/* ✅ Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  modal.success ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {modal.success ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="green"
                    className="w-10 h-10"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="red"
                    className="w-10 h-10"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* ✅ ข้อความใน Modal */}
            <h2
              className={`text-lg font-semibold mb-4 ${
                modal.success ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {modal.text}
            </h2>

            {/* ✅ ปุ่มปิด Modal */}
            <button
              onClick={() => {
                setModal({ ...modal, show: false })
                if (modal.success) router.push('/admin/elderly')
              }}
              className="mt-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">แก้ไขข้อมูลผู้สูงอายุ</h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-6"
        >
          {/* 🔹 ข้อมูลพื้นฐาน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={label}>ชื่อ-สกุล</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={input}
                required
              />
            </div>
            <div>
              <label className={label}>เบอร์โทรศัพท์</label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>รหัสบัตรประชาชน</label>
              <input
                name="citizenID"
                value={formData.citizenID}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>วันเดือนปีเกิด (พ.ศ.)</label>
              <input
                type="text"
                name="birthDate"
                placeholder="เช่น 01/01/2500 หรือ 1-1-2500"
                value={formData.birthDate}
                onChange={handleChange}
                className={input}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                กรอกเป็นรูปแบบ วัน/เดือน/ปี พ.ศ.
              </p>
            </div>
            <div>
              <label className={label}>เพศ</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={input}
              >
                <option value="">เลือกเพศ</option>
                <option value="male">ชาย</option>
                <option value="female">หญิง</option>
              </select>
            </div>
          </div>

          {/* 🔹 ที่อยู่ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={label}>ที่อยู่</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>ตำบล</label>
              <input
                name="subdistrict"
                value={formData.subdistrict}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>อำเภอ</label>
              <input
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={input}
              />
            </div>
            <div>
              <label className={label}>จังหวัด</label>
              <input
                name="province"
                value={formData.province}
                onChange={handleChange}
                className={input}
              />
            </div>
          </div>

          {/* 🔹 พิกัด */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={label}>ละติจูด-ลองจิจูด</label>
              <input
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                className={input}
              />
            </div>
          </div>

          {/* 🔹 ปุ่ม */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/elderly')}
              className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
