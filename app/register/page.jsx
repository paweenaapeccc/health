'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: 'user',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    let data = {}
    try {
      data = await res.json()
    } catch {
      setError('เกิดข้อผิดพลาดขณะเชื่อมต่อ API')
      return
    }

    if (!res.ok) {
      setError(data.message || 'เกิดข้อผิดพลาด')
    } else {
      setShowPopup(true)
      setTimeout(() => {
        setShowPopup(false)
        router.push('/login')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br">
      {/* ✅ พื้นหลังตกแต่ง */}
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/images/health-bg.png"
          alt="background"
          fill
          className="object-cover blur-sm"
        />
      </div>

      {/* ✅ โลโก้ระบบ */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={90}
          height={90}
          className="rounded-full shadow-lg border-4 border-white"
        />
        <p className="text-gray-600 text-sm mt-3">
          สมัครสมาชิกใหม่เพื่อเริ่มต้นใช้งาน
        </p>
      </div>

      {/* ✅ กล่องฟอร์ม */}
      <div className="relative z-10 w-full max-w-md bg-white/90 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border border-teal-100">
        <h2 className="text-2xl font-semibold text-center mb-6 text-teal-800">
          สมัครสมาชิก
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 🔹 ชื่อ-นามสกุล */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                ชื่อ
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="ชื่อ"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                นามสกุล
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="นามสกุล"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 🔹 อีเมล */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 🔹 เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="กรอกเบอร์โทรศัพท์"
              value={form.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              maxLength={10}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 🔹 Username */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              placeholder="ชื่อผู้ใช้"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* 🔹 Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition duration-300 shadow-md"
          >
            สมัครสมาชิก
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{' '}
          <Link
            href="/login"
            className="text-teal-700 font-medium hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>

      {/* ✅ Popup สำเร็จ */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl text-center animate-fadeIn">
            <h3 className="text-xl font-semibold text-teal-700 mb-2">
              สมัครสมาชิกสำเร็จ!
            </h3>
            <p className="text-gray-600">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        </div>
      )}
    </div>
  )
}
