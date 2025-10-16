'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Info, LogIn, LogOut, UserPlus, Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname() || ''
  const hideNavbar = useMemo(() => {
    const protectedPrefixes = ['/member', '/admin', '/executive']
    return protectedPrefixes.some((p) => pathname.startsWith(p))
  }, [pathname])

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' })
        const data = await res.json()
        if (cancelled) return
        setIsLoggedIn(!!data.isLoggedIn)
        setUsername(data.username || '')
        setRole(data.role || '')
      } catch {
        if (cancelled) return
        setIsLoggedIn(false)
        setUsername('')
        setRole('')
      }
    }
    checkSession()
    return () => {
      cancelled = true
    }
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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ✅ Logo + ชื่อระบบ */}
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

          {/* ✅ ปุ่ม Hamburger (มือถือ) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* ✅ เมนู Desktop */}
          <ul className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
            <li>
              <Link
                href="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Home size={20} />
                <span>หน้าหลัก</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/about'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Info size={20} />
                <span>เกี่ยวกับเรา</span>
              </Link>
            </li>

            {isLoggedIn && (
              <li className="text-sm text-gray-800">
                สวัสดี, {username}
                {role ? ` (${role})` : ''}
              </li>
            )}

            {!isLoggedIn ? (
              <>
                <li>
                  <Link
                    href="/register"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-green-100"
                  >
                    <UserPlus size={20} />
                    <span>สมัครสมาชิก</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100"
                  >
                    <LogIn size={20} />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                </li>
              </>
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

      {/* ✅ เมนู Mobile */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
          <ul className="flex flex-col space-y-2 p-4 text-gray-700 font-medium">
            <li>
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Home size={20} />
                <span>หน้าหลัก</span>
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/about'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Info size={20} />
                <span>เกี่ยวกับเรา</span>
              </Link>
            </li>

            {isLoggedIn && (
              <li className="text-sm text-gray-800 px-3 py-2">
                สวัสดี, {username}
                {role ? ` (${role})` : ''}
              </li>
            )}

            {!isLoggedIn ? (
              <>
                <li>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-green-100"
                  >
                    <UserPlus size={20} />
                    <span>สมัครสมาชิก</span>
                  </Link>
                </li>
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
              </>
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
