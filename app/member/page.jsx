'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [role, setRole] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')

    console.log('token:', token)
    console.log('role:', storedRole)

    if (token && storedRole === 'user') {
      setRole('user')
    } else {
      setRole(null)
    }
  }, [])

  return (
    <div>
      {/* ✅ Layout แบ่งเป็น 2 ฝั่ง */}
      <div className="flex flex-col md:flex-row items-start justify-center gap-10 px-4 md:px-12 py-16">
        
        {/* ✅ ฝั่งซ้าย — เนื้อหาทั้งหมดของคุณ */}
        <div className="flex-1 w-full max-w-4xl relative">
          <main className="flex-grow flex justify-center items-start">
            <div className="w-full max-w-4xl">
              {/* กล่องใหญ่สีเขียวอ่อน ครอบทุกอย่าง */}
              <section className="bg-teal-50 border border-teal-200 rounded-2xl shadow-md p-6 md:p-10 space-y-8">
                {/* ✅ หัวข้อใหญ่ */}
                <h1 className="text-2xl font-bold text-center text-teal-800">
                  รู้จักโรคข้อเข่าเสื่อม อาการ สาเหตุ พร้อมแนวทางการรักษาอย่างถูกวิธี
                </h1>

                {/* —— เนื้อหาคงที่ —— */}

                {/* โรคข้อเข่าเสื่อมคืออะไร? */}
                <p className="text-gray-700 leading-relaxed">
                  <span className="font-bold text-teal-800">โรคข้อเข่าเสื่อมคืออะไร?</span><br />
                  โรคข้อเข่าเสื่อม (Knee Osteoarthritis) คือโรคที่เกิดจากความเสื่อมของกระดูกอ่อนผิวข้อเข่า 
                  ทั้งทางด้านรูปร่าง โครงสร้าง การทำงานของกระดูกข้อต่อ 
                  และกระดูกบริเวณใกล้ข้อมีการสึกหรอและเสื่อมลงตามอายุ 
                  เมื่อไม่มีผิวกระดูกอ่อนมาห่อหุ้ม เนื้อกระดูกจึงมีการชนกันขณะรับน้ำหนัก 
                  ทำให้เกิดอาการปวดเข่า เข่าบวม ข้อยึดติด 
                  โดยจะรุนแรงขึ้นเรื่อย ๆ เมื่อเวลาผ่านไปนาน ๆ 
                  หัวเข่าก็จะผิดรูป และไม่สามารถประกอบกิจวัตรประจำวันได้ตามปกติ
                </p>

                {/* สาเหตุของโรคข้อเข่าเสื่อม */}
                <section className="bg-white p-6 rounded-xl shadow-md space-y-4 mt-2 border border-gray-200">
                  <h2 className="text-2xl font-bold text-teal-700">
                    สาเหตุของโรคข้อเข่าเสื่อมมีอะไรบ้าง?
                  </h2>

                  <p className="text-gray-700">
                    โรคข้อเข่าเสื่อมเกิดได้จากทั้ง 
                    <span className="font-medium text-teal-600"> ความเสื่อมตามธรรมชาติ </span>
                    และ
                    <span className="font-medium text-teal-600"> ปัจจัยภายนอกที่ทำลายข้อเข่า </span>
                    โดยแบ่งเป็น 2 กลุ่มใหญ่:
                  </p>

                  {/* 1. ปฐมภูมิ */}
                  <div>
                    <h3 className="text-lg font-semibold text-teal-600">
                      1. ความเสื่อมแบบปฐมภูมิ (Primary)
                    </h3>
                    <ul className="list-inside text-gray-700 space-y-1">
                      <li><b>อายุ:</b> ยิ่งอายุมาก ความเสื่อมของกระดูกอ่อน ข้อต่อ และกล้ามเนื้อรอบข้อก็เพิ่มขึ้น</li>
                      <li><b>เพศ:</b> ผู้หญิงเสี่ยงมากกว่าผู้ชาย โดยเฉพาะหลังหมดประจำเดือน</li>
                      <li><b>กรรมพันธุ์:</b> หากครอบครัวมีประวัติข้อเข่าเสื่อม โอกาสเสี่ยงจะมากขึ้น</li>
                      <li><b>น้ำหนักเกิน/อ้วน:</b> เพิ่มแรงกดที่ข้อเข่า ทำให้เสื่อมเร็วกว่าปกติ</li>
                      <li><b>การใช้งานข้อเกินพอดี:</b> เช่น ยืนหรือยกของหนักบ่อย นั่งพับเพียบ คุกเข่า นั่งขัดสมาธิ</li>
                    </ul>
                  </div>

                  {/* 2. ทุติยภูมิ */}
                  <div>
                    <h3 className="text-lg font-semibold text-teal-600">
                      2. ความเสื่อมแบบทุติยภูมิ (Secondary)
                    </h3>
                    <ul className="list-inside text-gray-700 space-y-1">
                      <li><b>อุบัติเหตุหรือบาดเจ็บ:</b> เช่น เข่าบิด กระดูกรอบข้อหัก มีเลือดออกในข้อ</li>
                      <li><b>โรคบางชนิด:</b> เช่น ข้ออักเสบรูมาตอยด์ เกาต์ ข้อเข่าติดเชื้อ หรือข้ออักเสบเรื้อรัง</li>
                      <li><b>การเล่นกีฬาที่แรงกระแทกสูง:</b> ทำให้ข้อต่อเข่าเสื่อมเร็วขึ้น</li>
                    </ul>
                  </div>
                </section>

                {/* ลักษณะอาการและสัญญาณเตือน */}
                <section className="bg-white p-6 rounded-xl shadow-md space-y-4 mt-2 border border-gray-200">
                  <h2 className="text-2xl font-bold text-teal-700">
                    ลักษณะอาการและสัญญาณเตือนโรคข้อเข่าเสื่อม
                  </h2>

                  <p className="text-gray-700">
                    อาการของโรคข้อเข่าเสื่อมมักค่อย ๆ แสดงออกทีละน้อย 
                    ผู้ป่วยมักละเลยในระยะแรก แต่สามารถสังเกตสัญญาณเตือนสำคัญได้ดังนี้:
                  </p>

                  <ul className="list-inside text-gray-700 space-y-2">
                    <li><b>ปวดหัวเข่า:</b> ปวดมากขึ้นเมื่อใช้งาน เช่น เดินขึ้น-ลงบันได นั่งยอง ๆ แต่จะดีขึ้นเมื่อพัก</li>
                    <li><b>เสียงกรอบแกรบ:</b> เกิดจากผิวข้อเสื่อม มีการเสียดสี ทำให้มีเสียงขณะเคลื่อนไหว</li>
                    <li><b>ข้อเข่าติด-ฝืด:</b> มักเป็นตอนเช้าหลังตื่นนอน หรือหลังอยู่ท่าเดียวนาน ๆ</li>
                    <li><b>เสียวหัวเข่า:</b> เกิดจากข้อเข่าหลวม หรือกล้ามเนื้อต้นขาอ่อนแรง</li>
                    <li><b>บวม ร้อน กดเจ็บ:</b> จากน้ำในข้อเพิ่มขึ้นหรือกระดูกงอก หากอักเสบจะรู้สึกอุ่นและเจ็บเมื่อกด</li>
                    <li><b>ข้อเข่าโก่งงอ ผิดรูป:</b> ขาโก่ง ต้นขาลีบ ข้อเข่าผิดรูป ทำให้เดินลำบากและปวดเวลาเคลื่อนไหว</li>
                  </ul>
                </section>

                {/* ✅ แหล่งอ้างอิง */}
                <div className="mt-8 p-4 sm:p-5 bg-white border border-teal-200 rounded-xl shadow-sm text-center">
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    แหล่งอ้างอิงข้อมูล:
                    <br />
                    <a
                      href="https://www.phyathai.com/th/article/3784-%E0%B8%A3%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%81%E0%B9%82%E0%B8%A3%E0%B8%84%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B9%80%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B9%80%E0%B8%AA%E0%B8%B7%E0%B9%88%E0%B8%AD"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 underline hover:text-teal-900 break-words"
                    >
                      โรงพยาบาลพญาไท – รู้จักโรคข้อเข่าเสื่อม อาการ สาเหตุ พร้อมแนวทางการรักษาอย่างถูกวิธี
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </main>
        </div>

        {/* สำหรับ desktop */}
  {/* สำหรับ Desktop */}
{/* สำหรับ Desktop */}
<div className="hidden md:flex flex-col justify-center items-center gap-8 md:gap-10">
  {[
    '/images/knee-left.png',
    '/images/knee-right.png',
    '/images/knee-top.png',
    '/images/knee-bottom.png'
  ].map((src, i) => (
    <Image
      key={i}
      src={src}
      alt={`ตกแต่ง ${i}`}
      width={260}
      height={260}
      className="rounded-3xl shadow-xl opacity-95 select-none pointer-events-none hover:scale-105 transition-transform duration-500"
      style={{ filter: 'brightness(1.08) contrast(1.1)' }}
    />
  ))}
</div>

{/* สำหรับ Mobile */}
<div className="flex md:hidden flex-wrap justify-center items-center gap-3 mt-6 px-3">
  {[
    '/images/knee-left.png',
    '/images/knee-right.png',
    '/images/knee-top.png',
    '/images/knee-bottom.png'
  ].map((src, i) => (
    <div
      key={i}
      className="flex-1 min-w-[45%] max-w-[45%] sm:min-w-[40%] sm:max-w-[40%] flex justify-center"
    >
      <Image
        src={src}
        alt={`ตกแต่งมือถือ ${i}`}
        width={200}
        height={200}
        className="w-full h-auto rounded-2xl shadow-md opacity-95 select-none pointer-events-none"
        style={{ filter: 'brightness(1.08) contrast(1.1)' }}
      />
    </div>
  ))}
</div>
        </div>
      </div>
  )
}
