// app/admin/reports/trend/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

export default function OATrendPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (startYear) qs.set('startYear', startYear);
      if (endYear) qs.set('endYear', endYear);
      const res = await fetch(`/api/reports/trend?${qs.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chartData = useMemo(() => {
    if (!data?.series) return [];
    return data.series.map((r) => ({ year: String(r.y), count: Number(r.cnt) }));
  }, [data]);

  // ✅ ฟังก์ชันดาวน์โหลด CSV
  const downloadCSV = () => {
    if (!chartData.length) return;

    const headers = ['ปี', 'จำนวนผู้มีภาวะข้อเข่าเสื่อม'];
    const rows = chartData.map(r => [r.year, r.count]);
    const total = chartData.reduce((a, b) => a + b.count, 0);
    rows.push(['รวม', total]);

    // รวมทั้งหมดเป็น CSV string
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');

    // ✅ ใส่ BOM \ufeff เพื่อให้ Excel อ่านภาษาไทยได้
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'OA_trend_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ✅ กล่องสีขาวเดียวครอบทุกอย่าง */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          รายงานแนวโน้มภาวะข้อเข่าเสื่อม (รายปี)
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-center">
          <div>
            <label className="block text-sm mb-1">ตั้งแต่ปี</label>
            <input
              type="number"
              placeholder="เช่น 2021"
              value={startYear}
              onChange={e => setStartYear(e.target.value)}
              className="border rounded px-3 py-2 w-36"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ถึงปี</label>
            <input
              type="number"
              placeholder="เช่น 2025"
              value={endYear}
              onChange={e => setEndYear(e.target.value)}
              className="border rounded px-3 py-2 w-36"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="px-5 py-2 rounded bg-blue-600 text-white shadow hover:bg-blue-700 transition"
            >
              ค้นหา
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

        {/* แสดงผลข้อมูล */}
        {loading ? (
          <div className="text-center py-6 text-gray-600">กำลังโหลด...</div>
        ) : !data ? (
          <div className="text-center text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
        ) : (
          <>
            {/* ✅ กราฟแนวโน้ม */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="font-semibold mb-2">แนวโน้มรายปี</div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="จำนวนผู้มีภาวะข้อเข่าเสื่อม"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ✅ ตารางข้อมูล */}
            <div className="overflow-x-auto border rounded-lg bg-white">
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

            <p className="text-sm text-gray-500 mt-3 text-center">
              เงื่อนไข OA: yesCount ≥ 3 หรือ resultText มีคำว่า “เข่าเสื่อม”
              {data.filter?.startYear && data.filter?.endYear && (
                <> | ช่วงปี: {data.filter.startYear}–{data.filter.endYear}</>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
