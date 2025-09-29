'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const genderLabel = (g) => (g === 'male' ? 'ชาย' : g === 'female' ? 'หญิง' : 'ไม่ระบุ');

export default function KneeOAReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set('start', start);
      if (end) qs.set('end', end);

      const res = await fetch(`/api/reports/knee_oa?${qs.toString()}`, { cache: 'no-store' });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text.slice(0,120)}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got: ${text.slice(0,120)}`);
      }

      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // first load

  const rows = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.byGender).map((g) => ({
      gender: g,
      ...data.byGender[g],
      rowTotal: Object.values(data.byGender[g]).reduce((a, b) => a + b, 0),
    }));
  }, [data]);

  const barData = useMemo(() => {
    if (!data) return [];
    return data.bands.map((band) => ({
      band,
      male: data.byGender?.male?.[band] ?? 0,
      female: data.byGender?.female?.[band] ?? 0,
      unknown: data.byGender?.unknown?.[band] ?? 0,
      total: data.totals?.[band] ?? 0,
    }));
  }, [data]);

  const pieGenderData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byGender || {}).map(([g, obj]) => ({
      name: genderLabel(g),
      value: Object.values(obj).reduce((a, b) => a + b, 0),
      key: g,
    }));
  }, [data]);

  const COLOR_BY_GENDER = { male: '#4F46E5', female: '#EC4899', unknown: '#9CA3AF' };
  const PIE_COLORS = ['#4F46E5', '#EC4899', '#9CA3AF'];

  const downloadCSV = () => {
    if (!data) return;
    const headers = ['เพศ', ...data.bands, 'รวม'];
    const lines = [headers.join(',')];
    rows.forEach(r => {
      const line = [
        genderLabel(r.gender),
        ...data.bands.map(b => r[b]),
        r.rowTotal
      ].join(',');
      lines.push(line);
    });
    lines.push(['รวม', ...data.bands.map(b => data.totals[b]), data.grandTotal].join(','));

    const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knee-oa-report.csv`; // <— แก้เป็น .csv
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="
        relative min-h-screen
        bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50
        dark:from-slate-900 dark:via-slate-950 dark:to-black
      "
    >
      {/* แสงเบลอเป็นฉากหลัง */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-25
                        bg-indigo-300 dark:bg-indigo-700" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full blur-3xl opacity-20
                        bg-pink-300 dark:bg-pink-700" />
        <div className="absolute bottom-[-60px] left-1/3 h-56 w-56 rounded-full blur-3xl opacity-20
                        bg-amber-300 dark:bg-amber-700" />
      </div>

      <div className="relative p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">รายงานภาวะข้อเข่าเสื่อม แยกตามเพศและช่วงอายุ</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
          <div>
            <label className="block text-sm mb-1">วันที่เริ่ม</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border rounded px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm mb-1">ถึงวันที่</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border rounded px-3 py-2"/>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="px-4 py-2 rounded bg-black text-white">โหลดข้อมูล</button>
            <button onClick={downloadCSV} disabled={!data} className="px-4 py-2 rounded border bg-white/70 backdrop-blur">
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div>กำลังโหลด...</div>
        ) : !data ? (
          <div className="text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
        ) : (
          <>
            {/* กราฟแท่ง + วงกลม */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 border rounded-lg p-4 bg-white/70 dark:bg-white/5 backdrop-blur">
                <div className="font-semibold mb-2">สถิติแยกตามช่วงอายุ (ซ้อนเพศ)</div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
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

              <div className="border rounded-lg p-4 bg-white/70 dark:bg-white/5 backdrop-blur">
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
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ตาราง */}
            <div className="overflow-x-auto border rounded-lg bg-white/80 dark:bg-white/5 backdrop-blur">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-white/10">
                  <tr>
                    <th className="p-2 border text-left">เพศ</th>
                    {data.bands.map(b => (
                      <th key={b} className="p-2 border text-right">{b}</th>
                    ))}
                    <th className="p-2 border text-right">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.gender} className="bg-white/40 dark:bg-white/0">
                      <td className="p-2 border">{genderLabel(r.gender)}</td>
                      {data.bands.map(b => (
                        <td key={b} className="p-2 border text-right">{r[b]}</td>
                      ))}
                      <td className="p-2 border text-right font-semibold">{r.rowTotal}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-white/10 font-semibold">
                    <td className="p-2 border">รวม</td>
                    {data.bands.map(b => (
                      <td key={b} className="p-2 border text-right">{data.totals[b]}</td>
                    ))}
                    <td className="p-2 border text-right">{data.grandTotal}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
