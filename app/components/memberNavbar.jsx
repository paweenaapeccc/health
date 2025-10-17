'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Info, Users, LogIn, LogOut, UserPlus, Menu, X } from 'lucide-react'

export default function MemberNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    setIsLoggedIn(false)
    setUsername('')
    setRole('')
    router.replace('/login')
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ✅ โลโก้ + ชื่อระบบ */} 
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="Logo"
              width={42}
              height={42}
              className="rounded-full"
              priority
            />
            <span className="font-semibold text-base sm:text-lg text-gray-900">
              ระบบสารสนเทศการดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม
            </span>
          </div>

          {/* ✅ ปุ่ม Hamburger (มือถือ) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* ✅ เมนู Desktop */}
          <ul className="hidden md:flex items-center space-x-6 text-gray-700 font-medium">
            <li>
              <Link
                href="/member"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/member'
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
                href="/member/elderly"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/elderly')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Users size={20} />
                <span>ผู้สูงอายุ</span>
              </Link>
            </li>

            <li>
              <Link
                href="/member/assessment"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/assessment')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <span>แบบประเมิน</span>
              </Link>
            </li>

            <li>
              <Link
                href="/member/about"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/member/about'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Info size={20} />
                <span>เกี่ยวกับเรา</span>
              </Link>
            </li>

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
              <>
                <li className="text-sm text-gray-800">
                  สวัสดี, {username}
                  {role ? ` (${role})` : ''}
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* ✅ เมนูมือถือ */}
      {menuOpen && (
        <div className="md:hidden bg-white/90 border-t border-gray-200 shadow-sm">
          <ul className="flex flex-col space-y-2 p-4 text-gray-700 font-medium">
            <li>
              <Link
                href="/member"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/member'
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
                href="/member/elderly"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/elderly')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Users size={20} />
                <span>ผู้สูงอายุ</span>
              </Link>
            </li>

            <li>
              <Link
                href="/member/assessment"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/assessment')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <span>แบบประเมิน</span>
              </Link>
            </li>

            <li>
              <Link
                href="/member/about"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/member/about'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'hover:bg-blue-100'
                }`}
              >
                <Info size={20} />
                <span>เกี่ยวกับเรา</span>
              </Link>
            </li>

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
              <>
                <li className="text-sm text-gray-800 px-3 py-2">
                  สวัสดี, {username}
                  {role ? ` (${role})` : ''}
                </li>
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
              </>
            )}
          </ul>
        </div>
      )}
    </nav>
  )
}
