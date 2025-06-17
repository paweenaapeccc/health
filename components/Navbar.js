'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, LogIn, Info } from 'lucide-react';

const navItems = [
  { href: '/', label: 'หน้าหลัก', icon: <Home size={20} /> },
  { href: '/login', label: 'เข้าสู่ระบบ', icon: <LogIn size={20} /> },
  { href: '/about', label: 'เกี่ยวกับเรา', icon: <Info size={20} /> },
];

export default function Navbar() {
  const pathname = usePathname();

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
        <ul className="flex space-x-6">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
                  pathname === item.href
                    ? 'bg-blue-200 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-blue-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
