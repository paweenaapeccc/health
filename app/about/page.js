"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, LogIn, Info } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AboutPage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[#e0f7f4] dark:bg-[#0f2f2e] text-black dark:text-white transition-colors duration-300">
      {/* About Section */}
      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-md w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-center mb-6">เกี่ยวกับระบบ</h1>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            ระบบดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อมนี้ถูกออกแบบมาเพื่อช่วยให้บุคลากรทางการแพทย์
            และครอบครัวสามารถติดตามข้อมูลสุขภาพของผู้สูงอายุได้อย่างมีประสิทธิภาพ
            ระบบมีฟังก์ชันในการบันทึกข้อมูล ตรวจสอบแนวโน้มสุขภาพ และให้คำแนะนำในการดูแล
            เพื่อลดความเสี่ยงในการเกิดภาวะแทรกซ้อนและช่วยให้ผู้สูงอายุมีคุณภาพชีวิตที่ดีขึ้น
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-xs text-gray-600 dark:text-gray-400 text-center py-4">
        © 2025 ระบบดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม. All rights reserved.
      </footer>
    </div>
  );
}
