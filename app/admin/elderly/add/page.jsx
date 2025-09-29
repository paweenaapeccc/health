'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

function ClientOnly({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return children
}

export default function AddElderlyAdminPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
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
    latlong: '' // ✅ เก็บพิกัดรวม "lat,long"
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/elderly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phoneNumber, // DB column คือ phonNumber
        }),
      })

      if (res.ok) {
        alert('เพิ่มข้อมูลผู้สูงอายุสำเร็จ')
        router.push('/admin/elderly')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'เกิดข้อผิดพลาด')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const antiAutofill = {
    autoComplete: 'off',
    'data-lpignore': 'true',
    'data-1p-ignore': 'true',
  }

  const label = 'text-sm font-medium text-slate-700'
  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'
  const sectionTitle = 'text-lg font-semibold text-slate-900 mb-4'

  return (
    <div className="">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">เพิ่มข้อมูลผู้สูงอายุ (Admin)</h1>
          <p className="mt-1 text-slate-600 text-sm">
            กรอกข้อมูลให้ครบถ้วน โดยเฉพาะช่องที่มีเครื่องหมาย <span className="text-red-500">*</span>
          </p>
        </header>

        <ClientOnly>
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-8" autoComplete="off">
            {/* ข้อมูลส่วนตัว */}
            <section>
              <h2 className={sectionTitle}>ข้อมูลส่วนตัว</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ชื่อ-สกุล <span className="text-red-500">*</span></label>
                  <input name="name" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                  <input name="phoneNumber" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>รหัสบัตรประชาชน <span className="text-red-500">*</span></label>
                  <input name="citizenID" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>วันเดือนปีเกิด <span className="text-red-500">*</span></label>
                  <input type="date" name="birthDate" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>เพศ <span className="text-red-500">*</span></label>
                  <select name="gender" className={input} onChange={handleChange} required defaultValue="" {...antiAutofill}>
                    <option value="" disabled>เลือกเพศ</option>
                    <option value="male">ชาย</option>
                    <option value="female">หญิง</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ที่อยู่ */}
            <section>
              <h2 className={sectionTitle}>ที่อยู่</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={label}>ที่อยู่ <span className="text-red-500">*</span></label>
                  <input name="address" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>ตำบล <span className="text-red-500">*</span></label>
                  <input name="subdistrict" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>อำเภอ <span className="text-red-500">*</span></label>
                  <input name="district" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>

                <div>
                  <label className={label}>จังหวัด <span className="text-red-500">*</span></label>
                  <input name="province" className={input} onChange={handleChange} required {...antiAutofill} />
                </div>
              </div>
            </section>

            {/* พิกัด (ไม่บังคับ) */}
            <section>
              <h2 className={sectionTitle}>พิกัด</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={label}>ละติจูด-ลองจิจูด (เช่น 14.999999,103.000000)</label>
                  <input
                    name="latlong"     // ✅ ใช้ชื่อฟิลด์ตรงกับ DB
                    placeholder="14.999999,103.000000"
                    className={input}
                    onChange={handleChange}
                    {...antiAutofill}
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/elderly')}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50 active:scale-[.99] transition"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60 active:scale-[.99] transition"
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                    <path d="M22 12a10 10 0 0 1-10 10" fill="currentColor" />
                  </svg>
                )}
                {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </ClientOnly>

        <p className="mt-4 text-center text-xs text-slate-500">
          ข้อมูลจะถูกเก็บรักษาตามนโยบายความเป็นส่วนตัวของระบบ
        </p>
      </div>
    </div>
  )
}
