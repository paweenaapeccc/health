'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        role: 'user', // 🔑 สมัครแล้วกำหนด role เป็น user ตลอด
      }),
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
