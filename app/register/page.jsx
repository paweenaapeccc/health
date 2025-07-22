'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [secret, setSecret] = useState('')       // เพิ่ม secret
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // ถ้า role เป็น admin หรือ executive ต้องกรอกรหัสลับ
    if ((role === 'admin' || role === 'executive') && !secret.trim()) {
      setError('กรุณากรอกรหัสลับสำหรับสิทธิ์นี้')
      return
    }

    setError('') // เคลียร์ error ก่อนส่ง

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role, secret }),
      headers: { 'Content-Type': 'application/json' },
    })

    let data = {}
    try {
      data = await res.json()
    } catch (err) {
      setError('เกิดข้อผิดพลาดขณะเชื่อมต่อ API')
      return
    }

    if (!res.ok) {
      setError(data.message || 'เกิดข้อผิดพลาด')
    } else {
      alert('สมัครสมาชิกสำเร็จ')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-teal-100 relative">
      {/* ปุ่มย้อนกลับนอกกล่องฟอร์ม */}
      <Link
        href="/login"
        className="absolute top-4 left-4 text-teal-700 text-sm hover:underline flex items-center"
      >
        <span className="mr-1 text-lg">&larr;</span> กลับเข้าสู่ระบบ
      </Link>

      {/* กล่องฟอร์มสมัคร */}
      <div className="flex items-center justify-center h-full px-4">
        <div className="w-full max-w-sm bg-white p-8 shadow-md rounded-2xl mt-10">
          <h2 className="text-2xl font-semibold text-center mb-6 mt-2">สมัครสมาชิก</h2>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                placeholder="Username"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">สิทธิ์ผู้ใช้</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="executive">ผู้บริหาร</option>
              </select>
            </div>

            {/* แสดงช่องกรอกรหัสลับเฉพาะ admin หรือ executive */}
            {(role === 'admin' || role === 'executive') && (
              <div>
                <label className="block text-sm font-medium mb-1">รหัสลับสำหรับสิทธิ์นี้</label>
                <input
                  type="password"
                  placeholder="กรอกรหัสลับ"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required={role === 'admin' || role === 'executive'}
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition duration-200"
            >
              สมัครสมาชิก
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
