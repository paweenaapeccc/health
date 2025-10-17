'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Login failed')
      } else {
        // ✅ redirect ตาม role
        if (data.role === 'admin') {
          router.push('/admin/elderly')
        } else if (data.role === 'executive') {
          router.push('/executive/osteo_analysis')
        } else {
          router.push('/member')
        }
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
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

      {/* ✅ โลโก้ + ชื่อระบบ */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={90}
          height={90}
          className="rounded-full shadow-lg border-4 border-white"
        />
        <p className="text-gray-600 text-sm mt-3">
          เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน
        </p>
      </div>

      {/* ✅ กล่องฟอร์มเข้าสู่ระบบ */}
      <div className="relative z-10 w-full max-w-md bg-white/90 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border border-teal-100">
        <h2 className="text-2xl font-semibold text-center mb-6 text-teal-800">
          เข้าสู่ระบบ
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="ชื่อผู้ใช้"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="รหัสผ่าน"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition duration-300 shadow-md"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="text-teal-700 font-medium hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
