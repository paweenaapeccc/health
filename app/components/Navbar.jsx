// components/NavbarWrapper.jsx
'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

export default function Navbarr() {
  const pathname = usePathname()
  const hideNavbar = pathname.startsWith('/member') || pathname.startsWith('/admin')

  if (hideNavbar) return null
  return <Navbar />
}
