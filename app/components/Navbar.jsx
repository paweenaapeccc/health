'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Info, LogIn, LogOut } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const hideNavbar = pathname.startsWith('/member') || pathname.startsWith('/admin')

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' })
        const data = await res.json()
        setIsLoggedIn(data.isLoggedIn)
        setUsername(data.username || '')
        setRole(data.role || '')
      } catch {
        setIsLoggedIn(false)
        setUsername('')
        setRole('')
      }
    }

    checkSession()
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' })
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
    window.location.href = '/'
  }

  if (hideNavbar) return null

  return (
    <nav className="py-4 sticky top-0 z-50" style={{ backgroundColor: '#33CCCC' }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo & System Name */}
        <div className="flex items-center gap-2">
          <Image src="/logo.jpeg" alt="Logo" width={40} height={40} />
          <span className="font-semibold text-lg text-black">
            ระบบดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม
          </span>
        </div>

        {/* Navigation Items */}
        <ul className="flex items-center space-x-6">
          {/* หน้าหลัก */}
          <li>
            <Link
              href="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                pathname === '/'
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-blue-100'
              }`}
            >
              <Home size={20} />
              <span>หน้าหลัก</span>
            </Link>
          </li>

          {/* เกี่ยวกับเรา */}
          <li>
            <Link
              href="/about"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                pathname === '/about'
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-blue-100'
              }`}
            >
              <Info size={20} />
              <span>เกี่ยวกับเรา</span>
            </Link>
          </li>

          {/* แสดงชื่อผู้ใช้ */}
          {isLoggedIn && (
            <li className="text-sm text-gray-800 dark:text-gray-200">
              สวัสดี, {username}
            </li>
          )}

          {/* เข้าสู่ระบบ / ออกจากระบบ */}
          {!isLoggedIn ? (
            <li>
              <Link
                href="/login"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100"
              >
                <LogIn size={20} />
                <span>เข้าสู่ระบบ</span>
              </Link>
            </li>
          ) : (
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
              >
                <LogOut size={20} />
                <span>ออกจากระบบ</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
