"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, LogIn, Info } from "lucide-react";
import { usePathname } from "next/navigation";

export default function HomePage() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-[#e0f7f4] dark:bg-[#0f2f2e] text-black dark:text-white transition-colors duration-300">
      {/* Main Content */}
      <main className="flex-grow grid place-items-center px-6 py-12 text-left">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-3xl font-bold text-center mb-6">
            ข้อมูลการดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม
          </h1>

          <section>
            <h2 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-2">
              การดูแลด้านพฤติกรรม
            </h2>
            <p>
              การดูแลผู้สูงอายุที่มีภาวะข้อเข่าเสื่อมควรเริ่มจากการปรับพฤติกรรมประจำวัน เช่น หลีกเลี่ยงท่าทางที่ไม่เหมาะสมอย่างการนั่งพับเพียบ คุกเข่า หรือนั่งยอง ๆ ซึ่งเพิ่มแรงกระทำต่อข้อเข่า ควรใช้เครื่องช่วยเดิน เช่นไม้เท้า และปรับสภาพแวดล้อมภายในบ้าน เช่น ใช้ชักโครกแทนส้วมนั่งยอง
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-2">
              การควบคุมน้ำหนักและออกกำลังกาย
            </h2>
            <p>
              น้ำหนักที่มากเกินไปจะเพิ่มภาระให้ข้อเข่า การลดน้ำหนักสามารถลดอาการปวดได้อย่างชัดเจน ควบคู่กับการออกกำลังกายที่เหมาะสม เช่น:
            </p>
            <ul className="list-disc list-inside pl-4">
              <li>การเดินเบา ๆ</li>
              <li>ว่ายน้ำ</li>
              <li>ปั่นจักรยานแรงต้านต่ำ</li>
              <li>โยคะ หรือ ไทเก๊ก</li>
            </ul>
            <p>
              ควรอยู่ภายใต้คำแนะนำของนักกายภาพบำบัด เพื่อความปลอดภัยและเหมาะสมต่อแต่ละบุคคล
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-teal-800 dark:text-teal-300 mb-2">
              การรักษาด้วยยาและการแพทย์
            </h2>
            <p>
              การใช้ยาทาภายนอกหรือยากินเพื่อลดอาการอักเสบควรอยู่ภายใต้คำแนะนำของแพทย์ อาจใช้ผลิตภัณฑ์เสริมอาหาร เช่น กลูโคซามีน หรือคอนดรอยติน และในบางกรณีอาจมีการฉีดยา เช่น:
            </p>
            <ul className="list-disc list-inside pl-4">
              <li>สเตียรอยด์</li>
              <li>กรดไฮยาลูรอนิก</li>
            </ul>
            <p>
              หากอาการรุนแรงจนไม่สามารถรักษาด้วยวิธีอื่นได้ การผ่าตัดเปลี่ยนข้อเข่าอาจเป็นทางเลือกสุดท้าย
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-xs text-gray-600 dark:text-gray-400 text-center py-4">
        © 2025 ระบบดูแลสุขภาพผู้สูงอายุที่มีภาวะข้อเข่าเสื่อม. All rights reserved.
      </footer>
    </div>
  );
}
