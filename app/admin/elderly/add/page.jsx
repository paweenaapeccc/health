'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddElderlyMemberPage() {
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
    latitude: '',
    longitude: ''
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
        // ไม่ต้องส่ง userId; API จะอ่านจาก JWT เอง
        body: JSON.stringify({
          ...formData,
          phone: formData.phoneNumber, // เผื่อ API เวอร์ชันอื่น
        })
      })

      if (res.ok) {
        alert('เพิ่มข้อมูลผู้สูงอายุสำเร็จ')
        router.push('/member/elderly')
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error || 'เกิดข้อผิดพลาด')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">
        เพิ่มข้อมูลผู้สูงอายุ (Member)
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <input name="name" placeholder="ชื่อ-สกุล" className="input" onChange={handleChange} required />
        <input name="phoneNumber" placeholder="เบอร์โทรศัพท์" className="input" onChange={handleChange} />
        <input name="citizenID" placeholder="รหัสบัตรประชาชน" className="input" onChange={handleChange} />
        <input type="date" name="birthDate" className="input" onChange={handleChange} required />
        <select name="gender" className="input" onChange={handleChange} required>
          <option value="">เลือกเพศ</option>
          <option value="male">ชาย</option>
          <option value="female">หญิง</option>
        </select>

        <input name="address" placeholder="ที่อยู่" className="input" onChange={handleChange} required />
        <input name="subdistrict" placeholder="ตำบล" className="input" onChange={handleChange} required />
        <input name="district" placeholder="อำเภอ" className="input" onChange={handleChange} required />
        <input name="province" placeholder="จังหวัด" className="input" onChange={handleChange} required />

        <input name="latitude" placeholder="ละติจูด" className="input" onChange={handleChange} />
        <input name="longitude" placeholder="ลองจิจูด" className="input" onChange={handleChange} />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </form>
    </div>
  )
}
