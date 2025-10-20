'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // ✅ preload รูปพื้นหลังไว้ก่อน (ไม่ต้องรอ render)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image()
      img.src = '/images/health-bg.png'
    }
  }, [])

  // ✅ แยก handleSubmit ด้วย transition เพื่อลด re-render ระหว่าง redirect
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          cache: 'no-store', // ⬅️ ไม่ดึง cache เดิม
          keepalive: true,   // ⬅️ ให้ connection ต่อเนื่องเร็วขึ้น
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Login failed')
          return
        }

        // ✅ redirect ตาม role โดยไม่ re-render หน้า
        const dest =
          data.role === 'admin'
            ? '/admin/elderly'
            : data.role === 'executive'
            ? '/executive/osteo_analysis'
            : '/member'

        router.replace(dest)
      } catch {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ')
      }
    })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden ">
      {/* ✅ ใช้ background ผ่าน CSS + preload แทน <Image fill> */}
      <div
        className="absolute inset-0 bg-[url('/images/health-bg.png')] bg-cover bg-center opacity-25 blur-sm"
        style={{ willChange: 'transform' }}
      ></div>

      {/* ✅ โลโก้ */}
      <div className="flex flex-col items-center mb-6 relative z-10">
        <Image
          src="/logo.jpeg"
          alt="Logo"
          width={90}
          height={90}
          priority // ⬅️ preload ภาพโลโก้ก่อน render
          className="rounded-full shadow-lg border-4 border-white"
        />
        <p className="text-gray-600 text-sm mt-3">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</p>
      </div>

      {/* ✅ ฟอร์ม */}
      <div className="relative z-10 w-full max-w-md bg-white/90 p-8 rounded-2xl shadow-2xl backdrop-blur-sm border border-teal-100 transition-transform duration-300">
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
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
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-lg hover:from-teal-700 hover:to-teal-800 transition duration-300 shadow-md disabled:opacity-60"
          >
            {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          ยังไม่มีบัญชี?{' '}
          <Link
            href="/register"
            className="text-teal-700 font-medium hover:underline"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
