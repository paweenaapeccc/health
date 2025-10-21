'use client'

import { useEffect, useState, useTransition } from 'react'

export default function FollowUpSummaryPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState([]) // 👈 เก็บข้อมูลประเมินแต่ละครั้ง
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ✅ โหลดข้อมูลสรุปจาก API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/followup?mode=summary', { cache: 'no-store' })
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('โหลดข้อมูลไม่สำเร็จ:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ✅ ฟังก์ชันโหลดรายละเอียดของผู้สูงอายุแต่ละคน
  const loadDetail = async (citiZenID) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/followup?mode=detail&citiZenID=${citiZenID}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      setDetail(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('โหลดรายละเอียดไม่สำเร็จ:', err)
      setDetail([])
    } finally {
      setLoadingDetail(false)
    }
  }

  // ✅ เมื่อกดปุ่มดูรายละเอียด
  const handleSelect = (row) => {
    setSelected(row)
    loadDetail(row.citiZenID)
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-lg mt-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">
        ข้อมูลการติดตามโรคของผู้สูงอายุ
      </h1>

      {/* ✅ ตารางสรุป */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-base text-gray-800">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">รหัสผู้สูงอายุ</th>
              <th className="p-3 text-left">ชื่อผู้สูงอายุ</th>
              <th className="p-3 text-center">จำนวนครั้งที่ทำแบบประเมิน</th>
              <th className="p-3 text-center w-40">การทำงาน</th>
            </tr>
          </thead>
          <tbody>
            {loading || isPending ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{r.citiZenID || '-'}</td>
                  <td className="p-3">{r.name || '-'}</td>
                  <td className="p-3 text-center">{r.totalAssessments || 0}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleSelect(r)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow cursor-pointer"
                    >
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal แสดงรายละเอียด */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 p-8 space-y-4 relative">
            <h2 className="text-2xl font-bold text-center text-blue-600">
              รายละเอียดการทำแบบประเมิน
            </h2>

            <div className="text-lg text-gray-800 space-y-2">
              <p>
                <b>ชื่อผู้สูงอายุ:</b> {selected.name}
              </p>
              <p>
                <b>จำนวนครั้งที่ทำแบบประเมิน:</b> {selected.totalAssessments || 0} ครั้ง
              </p>
            </div>

            {/* ตารางแสดงประวัติการประเมินแต่ละครั้ง */}
            <div className="overflow-x-auto mt-4">
              {loadingDetail ? (
                <p className="text-center text-gray-500 py-4">กำลังโหลดข้อมูล...</p>
              ) : detail.length === 0 ? (
                <p className="text-center text-gray-500 py-4">ไม่พบข้อมูลการประเมิน</p>
              ) : (
                <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">วันที่ประเมิน</th>
                      <th className="p-2 text-left">ผู้ประเมิน</th>
                      <th className="p-2 text-center">คะแนน</th>
                      <th className="p-2 text-left">ผลการประเมิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((d, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition">
                        <td className="p-2">{d.assessmentDate}</td>
                        <td className="p-2">{d.assessorName || '-'}</td>
                        <td className="p-2 text-center">{d.yesCount}</td>
                        <td className="p-2">{d.resultText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition shadow"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
