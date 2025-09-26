'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LogIn, LogOut, Info, Users, BarChart3, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [openReport, setOpenReport] = useState(false)

  const reportRef = useRef(null)

  // โหลดสถานะ session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' })
        const data = await res.json()
        setIsLoggedIn(!!data.isLoggedIn)
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

  // ปิด dropdown เมื่อคลิกนอก/กด Esc/เปลี่ยนเส้นทาง
  useEffect(() => {
    const onDocClick = (e) => {
      if (openReport && reportRef.current && !reportRef.current.contains(e.target)) {
        setOpenReport(false)
      }
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpenReport(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [openReport])

  // ปิด dropdown เมื่อเส้นทางเปลี่ยน
  useEffect(() => {
    setOpenReport(false)
  }, [pathname])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' })
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
    router.replace('/login')
  }

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')

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
              href="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                pathname === '/admin'
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-blue-100'
              }`}
            >
              <Home size={20} />
              <span>หน้าหลัก</span>
            </Link>
          </li>

          {/* Elderly (เฉพาะ admin) */}
          {isLoggedIn && role === 'admin' && (
            <li>
              <Link
                href="/admin/elderly"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  isActive('/admin/elderly')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                <Users size={20} />
                <span>ผู้สูงอายุ</span>
              </Link>
            </li>
          )}

          {/* เกี่ยวกับเรา */}
          <li>
            <Link
              href="/admin/about"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                pathname === '/admin/about'
                  ? 'bg-blue-200 text-blue-800 font-semibold'
                  : 'text-gray-700 hover:bg-blue-100'
              }`}
            >
              <Info size={20} />
              <span>เกี่ยวกับเรา</span>
            </Link>
          </li>

          {/* รายงาน (dropdown) */}
          {isLoggedIn && (
            <li className="relative" ref={reportRef}>
              <button
                onClick={() => setOpenReport((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={openReport}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  isActive('/admin/reports')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                <BarChart3 size={20} />
                <span>รายงาน</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openReport ? 'rotate-180' : ''}`}
                />
              </button>

              {openReport && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 rounded-xl border bg-white shadow-lg p-2"
                >
                  <Link
                    href="/admin/reports/knee_oa"
                    role="menuitem"
                    className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                      isActive('/admin/reports/knee_oa') ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                    • จำนวนผู้สูงอายุ OA แยกเพศและช่วงอายุ
                  </Link>
                  <Link
                    href="/admin/reports/trend"
                    role="menuitem"
                    className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                      isActive('/admin/reports/trend') ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                    • แนวโน้มภาวะ OA รายปี
                  </Link>
                </div>
              )}
            </li>
          )}

          {/* แสดงชื่อผู้ใช้ */}
          {isLoggedIn && (
            <li className="text-sm text-gray-800">
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
