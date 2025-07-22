'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LogIn, LogOut, Info } from 'lucide-react'
import { useEffect, useState } from 'react'

function MemberNavbar() {
  const pathname = usePathname()
  const router = useRouter()
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
    router.replace('/login')
  }

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
              href="/member"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === '/member'
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                } cursor-pointer`}
            >
              <Home size={20} />
              <span>หน้าหลัก</span>
            </Link>
          </li>

          {/* ทำแบบประเมิน */}
          <li>
            <Link
              href="/member/assessment"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/assessment')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                } cursor-pointer`}
            >
              <span>ทำแบบประเมิน</span>
            </Link>
          </li>

          {/* ผลการประเมิน */}
          <li>
            <Link
              href="/member/result"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname.startsWith('/member/result')
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                } cursor-pointer`}
            >
              <span>ผลการประเมิน</span>
            </Link>
          </li>

          {/* ปุ่มออกจากระบบ */}
          {isLoggedIn && (
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 cursor-pointer"
              >
                <LogOut size={20} />
                <span>ออกจากระบบ</span>
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default MemberNavbar;
