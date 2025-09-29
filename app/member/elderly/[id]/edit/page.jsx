'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditElderlyPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(true)
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
    latitude: '',
    longitude: ''
  })

  // โหลดข้อมูลเดิม
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
          birthDate: data.birthDate ? data.birthDate.slice(0, 10) : '',
          gender: data.gender ?? '',
          address: data.address ?? '',
          subdistrict: data.subdistrict ?? '',
          district: data.district ?? '',
          province: data.province ?? '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? ''
        })
      } catch (err) {
        alert('ไม่สามารถโหลดข้อมูลได้')
        router.push('/member/elderly')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, router])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/elderly/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phoneNumber
        })
      })
      if (res.ok) {
        alert('อัปเดตข้อมูลสำเร็จ')
        router.push('/member/elderly')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'เกิดข้อผิดพลาด')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">กำลังโหลดข้อมูล…</div>
  }

  const label = 'text-sm font-medium text-slate-700'
  const input =
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition'

  return (
    <div className="">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">แก้ไขข้อมูลผู้สูงอายุ</h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-6 md:p-8 space-y-6"
        >
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
              <label className={label}>วันเกิด</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className={input}
              />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
             <label className={label}>ละติจูด-ลองจิจูด
                  </label>
                  <input
                    name="latitude"
                    placeholder="เช่น 14.999999,103.000000"
                    className={input}
                    inputMode="decimal"
                    value={formData.latitude}
                    onChange={handleChange}
                    {...antiAutofill}
                  />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/member/elderly')}
              className="px-5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
