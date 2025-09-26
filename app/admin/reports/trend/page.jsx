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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">รายงานแนวโน้มภาวะข้อเข่าเสื่อม (รายปี)</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
        <div>
          <label className="block text-sm mb-1">ตั้งแต่ปี</label>
          <input type="number" placeholder="เช่น 2021"
            value={startYear} onChange={e => setStartYear(e.target.value)}
            className="border rounded px-3 py-2 w-36" />
        </div>
        <div>
          <label className="block text-sm mb-1">ถึงปี</label>
          <input type="number" placeholder="เช่น 2025"
            value={endYear} onChange={e => setEndYear(e.target.value)}
            className="border rounded px-3 py-2 w-36" />
        </div>
        <button onClick={load} className="px-4 py-2 rounded bg-black text-white">โหลดข้อมูล</button>
      </div>

      {loading ? (
        <div>กำลังโหลด...</div>
      ) : !data ? (
        <div className="text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
      ) : (
        <>
          <div className="border rounded-lg p-4 mb-6">
            <div className="font-semibold mb-2">แนวโน้มรายปี</div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="จำนวนผู้มี OA" stroke="#0ea5e9" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg">
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

          <p className="text-sm text-gray-500 mt-3">
            เงื่อนไข OA: yesCount ≥ 3 หรือ resultText มีคำว่า “เข่าเสื่อม”
            {data.filter?.startYear && data.filter?.endYear && (
              <> | ช่วงปี: {data.filter.startYear}–{data.filter.endYear}</>
            )}
          </p>
        </>
      )}
    </div>
  );
}
