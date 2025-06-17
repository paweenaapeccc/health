'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e) => {
  e.preventDefault()

  const res = await fetch('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, role }),
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
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl mb-4">สมัครสมาชิก</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          className="border p-2 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="executive">ผู้บริหาร</option>
        </select>
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          สมัครสมาชิก
        </button>
      </form>
    </div>
  )
}
