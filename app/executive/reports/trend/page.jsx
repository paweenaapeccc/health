'use client'

import { useEffect, useState, useMemo, Suspense, useTransition, useRef } from 'react'
import {
  ResponsiveContainer,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

export default function OATrendPage() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')
  const [isPending, startTransition] = useTransition()
  const controllerRef = useRef(null)

  // ✅ โหลดข้อมูลเร็วขึ้น (มี cache + cancel request)
  const load = async () => {
    setLoading(true)
    try {
      if (controllerRef.current) controllerRef.current.abort()
      controllerRef.current = new AbortController()

      const qs = new URLSearchParams()
      if (startYear) qs.set('startYear', startYear)
      if (endYear) qs.set('endYear', endYear)

      const res = await fetch(`/api/reports/trend?${qs.toString()}`, {
        signal: controllerRef.current.signal,
        cache: 'force-cache',
        next: { revalidate: 10 } // ✅ cache 10 วินาที
      })

      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()

      startTransition(() => setData(json))
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    load()
  }, [])

  // ✅ เตรียมข้อมูลกราฟ
  const chartData = useMemo(() => {
    if (!data?.series) return []
    return data.series.map((r) => ({
      year: String(r.y),
      count: Number(r.cnt),
    }))
  }, [data])

  // ✅ ดาวน์โหลด CSV
  const downloadCSV = () => {
    if (!chartData.length) return
    const headers = ['ปี', 'จำนวนผู้มีภาวะข้อเข่าเสื่อม']
    const rows = chartData.map(r => [r.year, r.count])
    const total = chartData.reduce((a, b) => a + b.count, 0)
    rows.push(['รวม', total])

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'OA_trend_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    )

  // ✅ UI หลัก
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          รายงานแนวโน้มภาวะข้อเข่าเสื่อม (รายปี)
        </h1>

        {/* 🔹 ฟิลเตอร์เลือกปี */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-center">
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
          <div className="flex gap-2">
            <button
              onClick={load}
              className={`px-5 py-2 rounded text-white shadow transition ${
                loading || isPending ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading || isPending ? 'กำลังโหลด...' : 'ค้นหา'}
            </button>
            <button
              onClick={downloadCSV}
              disabled={!chartData.length}
              className="px-5 py-2 rounded border bg-gray-50 hover:bg-gray-100 transition"
            >
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {/* 🔹 ส่วนข้อมูล */}
        <Suspense fallback={<div className="text-center py-6 text-gray-600">📊 กำลังโหลดกราฟ...</div>}>
          {loading ? (
            <div className="text-center py-6 text-gray-600">กำลังโหลด...</div>
          ) : !data ? (
            <div className="text-center text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
          ) : (
            <>
              {/* ✅ กราฟแนวโน้ม */}
              <div className="border rounded-lg p-4 bg-white shadow">
                <div className="font-semibold mb-3 text-gray-700 text-lg">แนวโน้มรายปี</div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 14, fill: "#374151" }}
                        axisLine={{ stroke: "#d1d5db" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 14, fill: "#374151" }}
                        axisLine={{ stroke: "#d1d5db" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "#111827", fontWeight: "600" }}
                        itemStyle={{ color: "#2563eb" }}
                      />
                      <Legend verticalAlign="top" align="center" iconType="circle" />
                      <defs>
                        <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Bar
                        dataKey="count"
                        name="จำนวนผู้มีภาวะข้อเข่าเสื่อม"
                        fill="url(#barColor)"
                        radius={[8, 8, 0, 0]}
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ✅ ตารางข้อมูล */}
              <Suspense fallback={<div className="text-center py-4">📄 กำลังโหลดตาราง...</div>}>
                <div className="overflow-x-auto border rounded-lg bg-white">
                  <table className="min-w-full text-sm">
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
              </Suspense>

              <p className="text-sm text-gray-500 mt-3 text-center">
                เงื่อนไข OA: yesCount ≥ 3 หรือ resultText มีคำว่า “เข่าเสื่อม”
                {data.filter?.startYear && data.filter?.endYear && (
                  <> | ช่วงปี: {data.filter.startYear}–{data.filter.endYear}</>
                )}
              </p>
            </>
          )}
        </Suspense>
      </div>
    </div>
  )
}
