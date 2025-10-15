'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

export default function OATrendPage() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (startYear) qs.set('startYear', startYear)
      if (endYear) qs.set('endYear', endYear)
      const res = await fetch(`/api/reports/trend?${qs.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    load()
  }, [])

  const chartData = useMemo(() => {
    if (!data?.series) return []
    return data.series.map((r) => ({
      year: String(r.y),
      count: Number(r.cnt),
    }))
  }, [data])

  const downloadCSV = () => {
    if (!data?.series) return
    const headers = ['ปี', 'จำนวนผู้มี OA']
    const lines = [headers.join(',')]
    chartData.forEach((r) => {
      lines.push([r.year, r.count].join(','))
    })
    const total = chartData.reduce((a, b) => a + b.count, 0)
    lines.push(['รวม', total].join(','))

    const blob = new Blob([`\ufeff${lines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'oa-trend-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="">
      <div
        id="trend-report"
        className="mx-auto max-w-6xl bg-white p-8 rounded-2xl shadow-xl"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            รายงานแนวโน้มภาวะข้อเข่าเสื่อม (รายปี)
          </h1>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 rounded border bg-gray-100 hover:bg-gray-200 transition text-sm"
            >
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {/* 🔹 ฟิลเตอร์เลือกปี */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-8">
          <div>
            <label className="block text-sm mb-1">ตั้งแต่ปี</label>
            <input
              type="number"
              placeholder="เช่น 2021"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              className="border rounded px-3 py-2 w-36"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ถึงปี</label>
            <input
              type="number"
              placeholder="เช่น 2025"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              className="border rounded px-3 py-2 w-36"
            />
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            โหลดข้อมูล
          </button>
        </div>

        {/* 🔹 ส่วนข้อมูล */}
        {loading ? (
          <div>กำลังโหลด...</div>
        ) : !data ? (
          <div className="text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
        ) : (
          <>
            {/* 🔹 กราฟแนวโน้ม */}
            <div className="border rounded-lg p-6 mb-8 bg-white shadow">
              <div className="font-semibold mb-2">แนวโน้มรายปี</div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="จำนวนผู้มี OA"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 🔹 ตารางสรุป */}
            <div className="overflow-x-auto border rounded-lg bg-white shadow mb-6">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border text-left">ปี</th>
                    <th className="p-2 border text-right">จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((r) => (
                    <tr key={r.year}>
                      <td className="p-2 border">{r.year}</td>
                      <td className="p-2 border text-right">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="p-2 border">รวม</td>
                    <td className="p-2 border text-right">
                      {chartData.reduce((a, b) => a + b.count, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 🔹 หมายเหตุ */}
            <p className="text-sm text-gray-500 mt-2">
              เงื่อนไข OA: yesCount ≥ 3 หรือ resultText มีคำว่า “เข่าเสื่อม”
              {data.filter?.startYear && data.filter?.endYear && (
                <> | ช่วงปี: {data.filter.startYear}–{data.filter.endYear}</>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
