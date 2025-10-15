'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts'

const genderLabel = (g) =>
  g === 'male' ? 'ชาย' : g === 'female' ? 'หญิง' : 'ไม่ระบุ'

export default function KneeOAReportPage() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  // ------------------ โหลดข้อมูล ------------------
  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (start) qs.set('start', start)
      if (end) qs.set('end', end)
      const res = await fetch(`/api/reports/knee_oa?${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    load()
  }, [])

  // ✅ ห้าม return null ก่อน Hooks เพื่อป้องกัน Hook order error
  // ------------------ การคำนวณ ------------------
  const rows = useMemo(() => {
    if (!data) return []
    return Object.keys(data.byGender || {}).map((g) => ({
      gender: g,
      ...data.byGender[g],
      rowTotal: Object.values(data.byGender[g]).reduce((a, b) => a + b, 0),
    }))
  }, [data])

  const barData = useMemo(() => {
    if (!data) return []
    return data.bands.map((band) => ({
      band,
      male: data.byGender?.male?.[band] ?? 0,
      female: data.byGender?.female?.[band] ?? 0,
      unknown: data.byGender?.unknown?.[band] ?? 0,
      total: data.totals?.[band] ?? 0,
    }))
  }, [data])

  const pieGenderData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.byGender || {}).map(([g, obj]) => ({
      name: genderLabel(g),
      value: Object.values(obj).reduce((a, b) => a + b, 0),
      key: g,
    }))
  }, [data])

  const COLOR_BY_GENDER = {
    male: '#4F46E5',
    female: '#EC4899',
    unknown: '#9CA3AF',
  }
  const PIE_COLORS = ['#4F46E5', '#EC4899', '#9CA3AF']

  const riskColor = (risk) => {
    switch (risk) {
      case 'เสี่ยงสูง':
        return 'text-red-600 font-semibold'
      case 'ไม่เสี่ยง':
        return 'text-green-600 font-semibold'
      case 'ยังไม่ประเมิน':
        return 'text-gray-500'
      default:
        return ''
    }
  }

  const downloadCSV = () => {
    if (!data) return
    const headers = ['เพศ', ...data.bands, 'รวม']
    const lines = [headers.join(',')]
    rows.forEach((r) => {
      const line = [
        genderLabel(r.gender),
        ...data.bands.map((b) => r[b]),
        r.rowTotal,
      ].join(',')
      lines.push(line)
    })
    lines.push([
      'รวม',
      ...data.bands.map((b) => data.totals[b]),
      data.grandTotal,
    ].join(','))

    const blob = new Blob([`\ufeff${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knee-oa-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ✅ ใช้หน้าจอโหลดเบื้องต้น แทน return null
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  // ------------------ UI หลัก ------------------
  return (
    <div className="min-h-screen ">
      <div className="mx-auto max-w-6xl bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          รายงานภาวะข้อเข่าเสื่อม แยกตามเพศและช่วงอายุ
        </h1>

        {/* 🔹 ฟิลเตอร์เลือกช่วงเวลา */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
          <div>
            <label className="block text-sm mb-1">วันที่เริ่ม</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ถึงวันที่</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              โหลดข้อมูล
            </button>
            <button
              onClick={downloadCSV}
              disabled={!data}
              className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200 transition"
            >
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {/* 🔹 ส่วนข้อมูล */}
        {loading ? (
          <div>กำลังโหลด...</div>
        ) : !data ? (
          <div className="text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
        ) : (
          <>
            {/* 🔹 กราฟแท่งและวงกลม */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 border rounded-lg p-4 bg-white shadow">
                <div className="font-semibold mb-2">
                  สถิติแยกตามช่วงอายุ (ซ้อนเพศ)
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="band" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" stackId="g" name="ชาย" fill={COLOR_BY_GENDER.male} />
                      <Bar dataKey="female" stackId="g" name="หญิง" fill={COLOR_BY_GENDER.female} />
                      <Bar dataKey="unknown" stackId="g" name="ไม่ระบุ" fill={COLOR_BY_GENDER.unknown} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-white shadow">
                <div className="font-semibold mb-2">สัดส่วนตามเพศ (ทั้งหมด)</div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={pieGenderData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {pieGenderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 🔹 ตารางสรุป */}
            <div className="overflow-x-auto border rounded-lg mb-8 bg-white shadow">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border text-left">เพศ</th>
                    {data.bands.map((b) => (
                      <th key={b} className="p-2 border text-right">{b}</th>
                    ))}
                    <th className="p-2 border text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.gender}>
                      <td className="p-2 border">{genderLabel(r.gender)}</td>
                      {data.bands.map((b) => (
                        <td key={b} className="p-2 border text-right">{r[b]}</td>
                      ))}
                      <td className="p-2 border text-right font-semibold">{r.rowTotal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="p-2 border">รวม</td>
                    {data.bands.map((b) => (
                      <td key={b} className="p-2 border text-right">{data.totals[b]}</td>
                    ))}
                    <td className="p-2 border text-right">{data.grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 🔹 ตารางรายชื่อผู้สูงอายุ */}
            <div className="overflow-x-auto border rounded-lg bg-white shadow">
              <h2 className="text-lg font-semibold p-4 border-b">
                รายชื่อผู้สูงอายุและระดับความเสี่ยง
              </h2>
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border text-left">รหัส</th>
                    <th className="p-2 border text-left">ชื่อ-สกุล</th>
                    <th className="p-2 border text-left">เพศ</th>
                    <th className="p-2 border text-right">อายุ</th>
                    <th className="p-2 border text-left">กลุ่มความเสี่ยง</th>
                    <th className="p-2 border text-left">ผลการประเมินล่าสุด</th>
                    <th className="p-2 border text-left">วันที่ประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Map((data.list || []).map((p) => [p.elderlyID, p])).values()).map((p) => (
                    <tr key={p.elderlyID}>
                      <td className="p-2 border">{p.elderlyID}</td>
                      <td className="p-2 border">{p.name}</td>
                      <td className="p-2 border">{genderLabel(p.gender)}</td>
                      <td className="p-2 border text-right">{p.age}</td>
                      <td className={`p-2 border ${riskColor(p.riskGroup)}`}>{p.riskGroup}</td>
                      <td className="p-2 border">{p.resultText}</td>
                      <td className="p-2 border">
                        {mounted && p.assessmentDate
                          ? new Date(p.assessmentDate).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
