'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminMainPage() {
  const router = useRouter();

  return (
    <div>
      {/* ปุ่มย้อนกลับ ติดมุมบนซ้าย */}
      <button
        onClick={() => router.back()}
        className="block p-2 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition font-semibold text-yellow-800"
        aria-label="ย้อนกลับ"
      >
        ← ย้อนกลับ
      </button>

      {/* เนื้อหากลางจอ */}
      <div className="max-w-md mx-auto pt-24 px-6">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-teal-900">
          เมนูจัดการข้อมูล
        </h1>

        <div className="space-y-5">
          <Link
            href="/admin/manageuser"
            className="block p-5 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition font-semibold text-yellow-800"
          >
            🧑‍💼 ข้อมูลสมาชิก
          </Link>

          <Link
            href="/admin/healthinfo"
            className="block p-5 bg-amber-100 rounded-lg hover:bg-amber-200 transition font-semibold text-amber-800"
          >
            🩺 ข้อมูลหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
