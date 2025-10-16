'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return children
}

export default function AddElderlyMemberPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState({ show: false, message: '', success: false })

  // ✅ ฟอร์มข้อมูลผู้สูงอายุ
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
    latlong: '', // ✅ ใช้ช่องเดียว
    height: '',
    weight: '',
    congenitalDisease: '',
    note: ''
  })

  const parseThaiDateInput = (text) => {
    if (!text) return ''
    const match = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
    if (!match) return ''
    const [_, day, month, yearThai] = match
    const yearAD = parseInt(yearThai) - 543
    return `${yearAD}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/elderly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          birthDate: parseThaiDateInput(formData.birthDate)
        })
      })

      if (res.ok) {
        setModal({ show: true, message: 'เพิ่มข้อมูลผู้สูงอายุสำเร็จ', success: true })
        setTimeout(() => router.push('/member/elderly'), 1500)
      } else {
        const data = await res.json()
        setModal({ show: true, message: data?.error || 'เกิดข้อผิดพลาด', success: false })
      }
    } catch {
      setModal({ show: true, message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', success: false })
    } finally {
      setSubmitting(false)
      setTimeout(() => setModal({ show: false, message: '', success: false }), 1500)
    }
  }

  const label = 'text-sm font-medium text-slate-700'
  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
  const sectionTitle = 'text-lg font-semibold text-slate-900 mb-4'

  return (
    <div className="relative">
      {modal.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]">
          <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full mx-4 text-center">
            <h2
              className={`text-xl font-bold mb-2 ${
                modal.success ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {modal.success ? 'สำเร็จ' : 'แจ้งเตือน'}
            </h2>
            <p className="text-gray-700 mb-4">{modal.message}</p>
            <button
              onClick={() => setModal({ show: false, message: '', success: false })}
              className={`px-6 py-2.5 rounded-xl text-white font-medium shadow transition ${
                modal.success
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">เพิ่มข้อมูลผู้สูงอายุ (Member)</h1>
          <p className="mt-1 text-slate-600 text-sm">
            กรอกข้อมูลให้ครบถ้วนและถูกต้อง <span className="text-red-500">*</span>
          </p>
        </header>

        <ClientOnly>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-8"
          >
            <section>
              <h2 className={sectionTitle}>ข้อมูลส่วนตัว</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ชื่อ-สกุล *</label>
                  <input name="name" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>เบอร์โทรศัพท์ *</label>
                  <input name="phoneNumber" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>เลขบัตรประชาชน *</label>
                  <input name="citizenID" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>วันเดือนปีเกิด (พ.ศ.) *</label>
                  <input name="birthDate" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>เพศ *</label>
                  <select name="gender" className={input} onChange={handleChange} required>
                    <option value="">เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h2 className={sectionTitle}>ที่อยู่</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={label}>ที่อยู่ *</label>
                  <input name="address" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>ตำบล *</label>
                  <input name="subdistrict" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>อำเภอ *</label>
                  <input name="district" className={input} onChange={handleChange} required />
                </div>
                <div>
                  <label className={label}>จังหวัด *</label>
                  <input name="province" className={input} onChange={handleChange} required />
                </div>
              </div>
            </section>

            {/* ✅ พิกัดช่องเดียว */}
            <section>
              <h2 className={sectionTitle}>พิกัด</h2>
              <label className={label}>ละติจูด,ลองจิจูด</label>
              <input
                name="latlong"
                placeholder="14.9999,103.0000"
                className={input}
                onChange={handleChange}
              />
            </section>

            <section>
              <h2 className={sectionTitle}>ข้อมูลสุขภาพ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ส่วนสูง (ซม.)</label>
                  <input name="height" type="number" className={input} onChange={handleChange} />
                </div>
                <div>
                  <label className={label}>น้ำหนัก (กก.)</label>
                  <input name="weight" type="number" className={input} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                  <label className={label}>โรคประจำตัว</label>
                  <input name="congenitalDisease" className={input} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                  <label className={label}>หมายเหตุ</label>
                  <textarea name="note" rows="2" className={input} onChange={handleChange} />
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/member/elderly')}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-5 py-2.5 text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </ClientOnly>
      </div>
    </div>
  )
}
