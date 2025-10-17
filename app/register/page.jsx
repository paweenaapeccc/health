'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPopup, setShowPopup] = useState(false) // ✅ popup state
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
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
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Username
            </label>
            <input
              type="text"
              placeholder="กรอกชื่อผู้ใช้"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Password
            </label>
            <input
              type="password"
              placeholder="กรอกรหัสผ่าน"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          <Link href="/login" className="text-teal-700 font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>

      {/* ✅ ปุ่มกลับ */}
      <Link
        href="/login"
        className="absolute top-5 left-5 text-teal-800 text-sm hover:underline flex items-center z-20"
      >
        <span className="mr-1 text-lg">&larr;</span> กลับเข้าสู่ระบบ
      </Link>

      {/* ✅ Popup แสดงผลสำเร็จ */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl text-center animate-fadeIn">
            <h3 className="text-xl font-semibold text-teal-700 mb-2">
              สมัครสมาชิกสำเร็จ!
            </h3>
            <p className="text-gray-600">
              กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
