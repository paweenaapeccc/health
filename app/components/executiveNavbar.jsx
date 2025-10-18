'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LogIn,
  LogOut,
  Menu,
  X,
  Map,
  BarChart3,
  ChevronDown,
} from 'lucide-react'

export default function ExecutiveNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openReport, setOpenReport] = useState(false)
  const reportRef = useRef(null)

  // ✅ ตรวจสอบ session
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

  // ✅ ปิด dropdown รายงานเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reportRef.current && !reportRef.current.contains(e.target)) {
        setOpenReport(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // ✅ ออกจากระบบ
  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', cache: 'no-store' })
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
    router.replace('/login')
  }

  // ✅ ตรวจ active path
  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')

  const itemCls = (active) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
      active
        ? 'bg-blue-200 text-blue-800 font-semibold'
        : 'text-gray-700 hover:bg-blue-100'
    } cursor-pointer`

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🔹 แถวบน */}
        <div className="flex justify-between items-center h-16">
          {/* โลโก้และชื่อระบบ */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
              priority
            />
            <span className="font-semibold text-sm sm:text-lg text-gray-900">
              ระบบสารสนเทศการดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม
            </span>
          </div>

          {/* ปุ่ม Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
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
                  <Link
                    href="/executive/map"
                    className={itemCls(isActive('/executive/map'))}
                  >
                    <Map size={20} />
                    <span>แผนที่</span>
                  </Link>
                </li>
              </>
            )}

            {/* เมนูรายงาน */}
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
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg p-2">
                    <Link
                      href="/executive/reports/knee_oa"
                      className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                        isActive('/executive/reports/knee_oa')
                          ? 'bg-blue-50 font-semibold'
                          : ''
                      }`}
                    >
                      • รายงานจำนวนผู้สูงอายุ
                    </Link>
                    <Link
                      href="/executive/reports/trend"
                      className={`block px-3 py-2 rounded-lg hover:bg-gray-50 ${
                        isActive('/executive/reports/trend')
                          ? 'bg-blue-50 font-semibold'
                          : ''
                      }`}
                    >
                      • รายงานแนวโน้มต่อปี
                    </Link>
                  </div>
                )}
              </li>
            )}

            {isLoggedIn && (
              <li className="text-sm text-gray-800">สวัสดี, {username}</li>
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
      </div>

      {/* 🔹 เมนู Mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
          <ul className="flex flex-col space-y-2 p-4 text-gray-700 font-medium">
            {isLoggedIn && role === 'executive' && (
              <>
                <li>
                  <Link
                    href="/executive/osteo_analysis"
                    onClick={() => setMenuOpen(false)}
                    className={itemCls(isActive('/executive/osteo_analysis'))}
                  >
                    วิเคราะห์ข้อมูล
                  </Link>
                </li>
                <li>
                  <Link
                    href="/executive/map"
                    onClick={() => setMenuOpen(false)}
                    className={itemCls(isActive('/executive/map'))}
                  >
                    <Map size={20} />
                    <span>แผนที่</span>
                  </Link>
                </li>
              </>
            )}

            {/* รายงาน (accordion) */}
            {isLoggedIn && (
              <li>
                <details className="group">
                  <summary className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-100">
                    <span className="flex items-center gap-2">
                      <BarChart3 size={20} />
                      <span>รายงาน</span>
                    </span>
                    <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="pl-6 py-1 space-y-1">
                    <Link
                      href="/executive/reports/knee_oa"
                      onClick={() => setMenuOpen(false)}
                      className="block py-1 hover:text-blue-600"
                    >
                      • รายงานจำนวนผู้สูงอายุ
                    </Link>
                    <Link
                      href="/executive/reports/trend"
                      onClick={() => setMenuOpen(false)}
                      className="block py-1 hover:text-blue-600"
                    >
                      • รายงานแนวโน้มต่อปี
                    </Link>
                  </div>
                </details>
              </li>
            )}

            {isLoggedIn && (
              <li className="text-sm text-gray-800 px-3 py-2">
                สวัสดี, {username}
              </li>
            )}

            {!isLoggedIn ? (
              <li>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-100"
                >
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              </li>
            ) : (
              <li>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 w-full text-left"
                >
                  <LogOut size={20} />
                  <span>ออกจากระบบ</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  )
}
