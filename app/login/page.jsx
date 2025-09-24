'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)   // ⬅️ เพิ่ม
  const router = useRouter()

  useEffect(() => {
    setMounted(true)                              // ⬅️ เพิ่ม
    const role = localStorage.getItem('role')
    if (role === 'admin') router.replace('/admin')
    else if (role === 'executive') router.replace('/executive')
    else if (role === 'user') router.replace('/member')
  }, [router])

  if (!mounted) return null                       // ⬅️ กัน SSR/hydration mismatch

  const goByRole = (role) => {
    if (role === 'admin') router.push('/admin')
    else if (role === 'executive') router.push('/executive')
    else router.push('/member')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'Login failed')
        return
      }
      const role = data?.role || 'user'
      localStorage.setItem('role', role)
      goByRole(role)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-100 to-teal-200">
      <div className="w-full max-w-sm p-8 bg-white shadow-md rounded-2xl">
        <h2 className="text-2xl font-semibold text-center mb-6">เข้าสู่ระบบ</h2>

        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          ยังไม่มีบัญชี? <Link href="/register" className="text-teal-600 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  )
}
