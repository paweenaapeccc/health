'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LogIn, LogOut, Menu, X, Map, BarChart3, ChevronDown } from 'lucide-react'

export default function ExecutiveNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openReport, setOpenReport] = useState(false)
  const reportRef = useRef(null)

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

  const isActive = (path) => pathname.startsWith(path)

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' })
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
    router.replace('/login')
  }

  const itemCls = (active) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
      active ? 'bg-blue-200 text-blue-800 font-semibold' : 'text-gray-700 hover:bg-blue-100'
    }`

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🔹 แถวบนสุด */}
        <div className="flex justify-between items-center h-16">
          {/* โลโก้ + ชื่อระบบ */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={45}
              height={45}
              className="rounded-full"
              priority
            />
            <span className="font-semibold text-sm sm:text-lg text-gray-900 leading-tight">
              ระบบสารสนเทศการดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม
            </span>
          </div>

          {/* ปุ่ม Hamburger (มือถือ) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* 🔹 เมนู Desktop */}
          <ul className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
            {isLoggedIn && role === 'executive' && (
              <>
                <li>
                  <Link
                    href="/executive/osteo_analysis"
                    className={itemCls(isActive('/executive/osteo_analysis'))}
                  >
                    วิเคราะห์ข้อมูล
                  </Link>
                </li>
                <li>
                  <Link href="/executive/map" className={itemCls(isActive('/executive/map'))}>
                    <Map size={18} />
                    <span>แผนที่</span>
                  </Link>
                </li>
              </>
            )}

            {isLoggedIn && (
              <li className="relative" ref={reportRef}>
                <button
                  onClick={() => setOpenReport(!openReport)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition focus:outline-none ${
                    isActive('/executive/reports')
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
                  <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-white shadow-lg p-2">
                    <Link
                      href="/executive/reports/knee_oa"
                      className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                        isActive('/executive/reports/knee_oa') ? 'bg-blue-50 font-semibold' : ''
                      }`}
                    >
                      • รายงานจำนวนผู้สูงอายุ
                    </Link>
                    <Link
                      href="/executive/reports/trend"
                      className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                        isActive('/executive/reports/trend') ? 'bg-blue-50 font-semibold' : ''
                      }`}
                    >
                      • รายงานแนวโน้มต่อปี
                    </Link>
                  </div>
                )}
              </li>
            )}

            {isLoggedIn && (
              <li className="text-sm text-gray-800 whitespace-nowrap">
                สวัสดี, {username} ({role})
              </li>
            )}

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

        {/* 🔹 เมนูมือถือ (Dropdown ทั้งหมด) */}
        {menuOpen && (
          <div className="md:hidden mt-2 bg-white rounded-xl shadow-md border p-3 space-y-2">
            {isLoggedIn && role === 'executive' && (
              <>
                <Link
                  href="/executive/osteo_analysis"
                  className={`${itemCls(isActive('/executive/osteo_analysis'))} block`}
                  onClick={() => setMenuOpen(false)}
                >
                  วิเคราะห์ข้อมูล
                </Link>
                <Link
                  href="/executive/map"
                  className={`${itemCls(isActive('/executive/map'))} block`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Map size={18} />
                  <span>แผนที่</span>
                </Link>
              </>
            )}

            {/* ✅ รายงาน (Dropdown ย่อยในมือถือ) */}
            <div>
              <button
                onClick={() => setOpenReport(!openReport)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100 transition"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 size={18} />
                  <span>รายงาน</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${openReport ? 'rotate-180' : ''}`}
                />
              </button>

              {openReport && (
                <div className="pl-6 mt-1 space-y-1">
                  <Link
                    href="/executive/reports/knee_oa"
                    className={`block px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50 ${
                      isActive('/executive/reports/knee_oa') ? 'bg-blue-100 font-semibold' : ''
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    • รายงานจำนวนผู้สูงอายุ
                  </Link>
                  <Link
                    href="/executive/reports/trend"
                    className={`block px-3 py-1.5 rounded-lg text-sm hover:bg-blue-50 ${
                      isActive('/executive/reports/trend') ? 'bg-blue-100 font-semibold' : ''
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    • รายงานแนวโน้มต่อปี
                  </Link>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="px-3 py-1 text-gray-800 text-sm">
                {username} ({role})
              </div>
            )}

            {!isLoggedIn ? (
              <Link
                href="/login"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100"
                onClick={() => setMenuOpen(false)}
              >
                <LogIn size={20} />
                <span>เข้าสู่ระบบ</span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  handleLogout()
                  setMenuOpen(false)
                }}
                className="flex items-center space-x-2 px-3 py-2 w-full rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
              >
                <LogOut size={20} />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
