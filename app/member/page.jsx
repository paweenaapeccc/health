'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
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

    async function fetchHealthInfo() {
      try {
        const res = await fetch('/api/healthinfo')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData([])
        }
      } catch (error) {
        console.error('Failed to fetch health info:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHealthInfo()
  }, [])

  return (
    <div>
      <main className="flex-grow flex justify-center items-start px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* กล่องใหญ่สีเขียวอ่อน ครอบทุกอย่าง */}
          <section className="bg-teal-50 border border-teal-200 rounded-2xl shadow-md p-6 md:p-10 space-y-8">
            {/* ✅ หัวข้อใหญ่ */}
            <h1 className="text-2xl font-bold text-center text-teal-800">
              รู้จักโรคข้อเข่าเสื่อม อาการ สาเหตุ พร้อมแนวทางการรักษาอย่างถูกวิธี
            </h1>

            {/* แสดงข้อมูลสุขภาพ */}
            {loading && <p className="text-center">กำลังโหลดข้อมูล...</p>}

            {!loading && data && data.length > 0 && (
              <div className="space-y-6">
                {data.map(({ id, title, content, updated_at }) => (
                  <article key={id} className="p-6 bg-white rounded-xl shadow border border-gray-200">
                    <h2 className="text-2xl font-semibold text-teal-700">{title}</h2>
                    <p className="text-gray-700">{content}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      อัปเดตเมื่อ: {new Date(updated_at).toLocaleString('th-TH')}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {/* ความรู้คงที่ (โค้ดเดิม แค่แยก <p> กับ <section> ไม่ให้ซ้อนกัน) */}
            {!loading && (!data || data.length === 0) && (
              <>
                {/* ย่อหน้า: โรคข้อเข่าเสื่อมคืออะไร  👉 เอา bg ของย่อหน้าออก ให้ใช้พื้นจากกล่องใหญ่ */}
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

                {/* สาเหตุของโรคข้อเข่าเสื่อม (การ์ดขาวด้านในเหมือนภาพ) */}
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

                {/* ระยะอาการของโรค */}
                <section className="bg-white p-6 rounded-xl shadow-md space-y-4 mt-2 border border-gray-200">
                  <h2 className="text-2xl font-bold text-teal-700">
                    ระยะอาการของโรคข้อเข่าเสื่อม
                  </h2>

                  <p className="text-gray-700">
                    โดยทั่วไประยะของโรคข้อเข่าเสื่อมแบ่งได้เป็น 4 ระยะ ดังนี้:
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                      <thead className="bg-teal-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">ระยะ</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">ลักษณะอาการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">ระยะที่ 1</td>
                          <td className="border border-gray-300 px-4 py-2">ยังทำงานทุกอย่างได้ตามปกติ</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">ระยะที่ 2</td>
                          <td className="border border-gray-300 px-4 py-2">เริ่มทำงานหนักไม่ได้</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">ระยะที่ 3</td>
                          <td className="border border-gray-300 px-4 py-2">ยังทำกิจวัตรประจำวันได้</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">ระยะที่ 4</td>
                          <td className="border border-gray-300 px-4 py-2">เดินไม่ไหว เคลื่อนไหวลำบาก</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    หากอยู่ใน <span className="font-medium text-teal-600">ระยะที่ 1 หรือระยะแรก</span> 
                    ผู้ป่วยสามารถดูแลตัวเองได้ด้วยการปรับพฤติกรรม เช่น  
                    หลีกเลี่ยงท่านั่งที่กดแรงต่อข้อ (พับเพียบ คุกเข่า ขัดสมาธิ ยอง ๆ ไขว่ห้าง)  
                    ลดการขึ้นลงบันไดโดยไม่จำเป็น และหลีกเลี่ยงการยกของหนัก ๆ  
                    โดยเฉพาะในผู้ที่ทำงานยืนทั้งวัน ควรพักนั่งเป็นระยะ ๆ เพื่อชะลอการเสื่อมของข้อเข่า
                    <br /><br />
                    สำหรับผู้ป่วยที่เริ่มมีอาการเตือนตั้งแต่ระยะที่ 2-4 แนะนำให้ปรึกษาแพทย์
                    เพื่อวางแผนทำการรักษา ซึ่งจะเป็นการป้องกันข้อไม่ให้ถูกทำลายมากขึ้น 
                    และลดโอกาสเกิดข้อเข่าเสื่อมรุนแรง
                  </p>
                </section>

                {/* แนวทางการรักษา */}
                <section className="bg-white p-6 rounded-xl shadow-md space-y-4 mt-2 border border-gray-200">
                  <h2 className="text-2xl font-bold text-teal-700">
                    แนวทางการรักษาโรคข้อเข่าเสื่อม
                  </h2>

                  <ul className="list-decimal list-inside text-gray-700 space-y-3">
                    <li>
                      <b>การรักษาที่ไม่ใช้ยา (Non-pharmacological therapy):</b>
                      ปรับเปลี่ยนพฤติกรรมการใช้ชีวิต เช่น ลดน้ำหนัก ออกกำลังกายที่เหมาะสม 
                      ใช้ข้อเข่าอย่างถูกวิธี หลีกเลี่ยงท่าที่กดแรงเกินไป
                    </li>
                    <li>
                      <b>กายภาพบำบัด:</b> บริหารกล้ามเนื้อ ฟื้นฟูการทำงานของข้อ 
                      ใช้เทคนิค เช่น อัลตราซาวด์ เลเซอร์ หรืออุปกรณ์พยุงข้อ (เฝือกอ่อน ผ้ารัดเข่า) 
                      แต่ไม่ควรใช้ต่อเนื่องนานเกินไปเพราะอาจทำให้กล้ามเนื้อลีบ
                    </li>
                    <li>
                      <b>การใช้ยา (Pharmacological therapy):</b>
                      อาจเป็นยารับประทานหรือฉีด เช่น ยาแก้ปวด/ลดอักเสบที่ไม่ใช่สเตียรอยด์ (NSAIDs), 
                      ยาช่วยปรับเปลี่ยนโครงสร้างข้อ (DMOADs) ซึ่งต้องได้รับการดูแลโดยแพทย์
                    </li>
                    <li>
                      <b>การรักษาโดยการผ่าตัด:</b> เหมาะกับผู้ป่วยที่อาการรุนแรง ไม่ตอบสนองต่อวิธีอื่น
                      <ul className="list-inside ml-6 space-y-1">
                        <li><b>Arthrodesis:</b> ผ่าตัดเชื่อมข้อให้ผิวข้อเข้ามาชิดกัน</li>
                        <li><b>Arthroplasty:</b> การผ่าตัดเปลี่ยนข้อเข่าเทียม</li>
                        <li><b>Osteotomy:</b> การตัดเปลี่ยนแนวกระดูกเพื่อปรับสมดุลแรงกด</li>
                      </ul>
                    </li>
                  </ul>

                  <p className="text-gray-700 leading-relaxed">
                    แม้โรคข้อเข่าเสื่อมมักเกิดขึ้นเมื่ออายุมากขึ้น 
                    แต่สามารถ<strong className="text-teal-600">ชะลอการเสื่อมและรักษาได้หลายวิธี</strong> 
                    หากเริ่มมีอาการปวดหรือลำบากในการใช้ชีวิต 
                    ควรรีบปรึกษาแพทย์เพื่อหาสาเหตุที่แท้จริง 
                    และเลือกวิธีรักษาที่เหมาะสม จะช่วยลดความรุนแรงของโรค 
                    และทำให้คุณภาพชีวิตดีขึ้น
                  </p>
                </section>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
