"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const RiskPill = ({ label }) => (
  <span
    className={`px-2 py-0.5 rounded text-xs font-medium
    ${label === "เสี่ยงต่ำ" ? "bg-emerald-100 text-emerald-800" :
      label === "เสี่ยงปานกลาง" ? "bg-amber-100 text-amber-800" :
      label === "เสี่ยงสูง" ? "bg-orange-100 text-orange-800" :
      "bg-rose-100 text-rose-800"}`}
  >
    {label}
  </span>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-md border border-gray-200 ${className}`}>
    {children}
  </div>
);

export default function ExecutiveOARiskListPage() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchJsonSafe = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); }
    catch { throw new Error(text || `HTTP ${res.status}`); }
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const load = async (p = page) => {
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (search.trim()) qs.set("search", search.trim());
      const json = await fetchJsonSafe(`/api/executive/oa_risk/list?${qs.toString()}`);
      setRows(json.rows || []);
      setTotal(json.total || 0);
      setPage(p);
    } catch (e) {
      setError(e.message || "เกิดข้อผิดพลาด");
      setRows([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);
  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / pageSize)), [total, pageSize]);

  // ---------- Export CSV ----------
  const toCSV = (items) => {
    const headers = [
      "elderlyID","ชื่อ-สกุล","เลขบัตรประชาชน","เบอร์โทร",
      "อำเภอ","จังหวัด","เพศ","อายุ",
      "วันที่ประเมินล่าสุด","ตอบใช่(ข้อ)","ระดับเสี่ยง"
    ];

    const escape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (/[\",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = items.map(r => ([
      r.elderlyID,
      r.name,
      r.citizenID ? `="${r.citizenID}"` : "",   // กันเลข 13 หลักหาย
      r.phone ? `="${r.phone}"` : "",           // กัน 0 นำหน้าหาย
      r.district || "",
      r.province || "",
      r.gender || "",
      r.age ?? "",
      r.lastAssessmentDate ? r.lastAssessmentDate.slice(0,10) : "",
      r.yesCount ?? "",
      r.riskLabel || ""
    ].map(escape).join(",")));

    return "\ufeff" + [headers.join(","), ...lines].join("\n");
  };

  const handleExport = async () => {
    try {
      setExporting(true); setError("");
      const qs = new URLSearchParams({ page: "1", pageSize: "100000" });
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (search.trim()) qs.set("search", search.trim());
      const json = await fetchJsonSafe(`/api/executive/oa_risk/list?${qs.toString()}`);
      const csv = toCSV(json.rows || []);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "oa_risk_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message || "Export ผิดพลาด");
    } finally {
      setExporting(false);
    }
  };
  // -------------------------------

  // helper: สร้าง href ให้ปลอดภัย ไม่หลุดเป็น [object Object]
  const makeDetailHref = (row) => {
    const id = typeof row === "object"
      ? (row?.elderlyID ?? row?.id ?? row?._id ?? row?.uuid ?? null)
      : row;
    if (!id) return null;
    return `/executive/oa_risk/${encodeURIComponent(String(id))}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header + Export */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            Executive · วิเคราะห์ความเสี่ยงข้อเข่าเสื่อม
          </h1>
          <p className="text-gray-600 mt-1">
            ผลประเมินล่าสุดรายบุคคล (จำนวนข้อที่ตอบ “ใช่” 2–5 ข้อ)
          </p>
        </div>
        <button
          suppressHydrationWarning
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 rounded-xl border bg-white shadow hover:bg-gray-50 disabled:opacity-50"
        >
          {exporting ? "กำลังส่งออก..." : "Export CSV"}
        </button>
      </div>

      {/* Card ครอบทุกส่วน */}
      <Card className="p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">เริ่ม</label>
            <input
              suppressHydrationWarning
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">สิ้นสุด</label>
            <input
              suppressHydrationWarning
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">ค้นหา (ชื่อ/บัตร/เบอร์/ที่อยู่)</label>
            <input
              suppressHydrationWarning
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load(1)}
              placeholder="เช่น นางสมศรี / 123456..."
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              suppressHydrationWarning
              onClick={() => load(1)}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium shadow hover:opacity-95"
            >
              {loading ? "กำลังโหลด..." : "ดึงข้อมูล"}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-rose-700">⚠️ {error}</div>}

        {/* Summary */}
        <div className="text-gray-700">ทั้งหมด: <b>{total}</b> ราย</div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 border-b">ผู้สูงอายุ</th>
                <th className="px-4 py-3 border-b">เลขบัตรประชาชน</th>
                <th className="px-4 py-3 border-b">เบอร์โทร</th>
                <th className="px-4 py-3 border-b">อำเภอ–จังหวัด</th>
                <th className="px-4 py-3 border-b">เพศ</th>
                <th className="px-4 py-3 border-b text-right">อายุ</th>
                <th className="px-4 py-3 border-b">วันที่ประเมินล่าสุด</th>
                <th className="px-4 py-3 border-b text-right">ตอบ “ใช่”</th>
                <th className="px-4 py-3 border-b">ระดับเสี่ยง</th>
                <th className="px-4 py-3 border-b"></th>
              </tr>
            </thead>
            <tbody className="bg-white/60">
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="px-4 py-3 border-b">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && rows.map((r) => {
                const href = makeDetailHref(r);
                const key = String(
                  (r?.elderlyID ?? r?.id ?? r?._id ?? r?.uuid ?? Math.random())
                );
                return (
                  <tr key={key} className="hover:bg-sky-50/50 transition">
                    <td className="px-4 py-3 border-b">{r.name}</td>
                    <td className="px-4 py-3 border-b">{r.citizenID}</td>
                    <td className="px-4 py-3 border-b">{r.phone}</td>
                    <td className="px-4 py-3 border-b">{r.district} – {r.province}</td>
                    <td className="px-4 py-3 border-b">{r.gender}</td>
                    <td className="px-4 py-3 border-b text-right">{r.age ?? "-"}</td>
                    <td className="px-4 py-3 border-b">{r.lastAssessmentDate?.slice(0, 10) ?? "-"}</td>
                    <td className="px-4 py-3 border-b text-right">{r.yesCount}</td>
                    <td className="px-4 py-3 border-b"><RiskPill label={r.riskLabel} /></td>
                    <td className="px-4 py-3 border-b text-center">
                      {href ? (
                        <Link
                          suppressHydrationWarning
                          href={href}
                          className="inline-block px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm shadow hover:opacity-95"
                        >
                          ดูรายบุคคล
                        </Link>
                      ) : (
                        <span className="inline-block px-3 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-sm">
                          ไม่มี ID
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr><td className="px-4 py-10 text-center text-gray-500" colSpan={10}>ไม่มีข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            suppressHydrationWarning
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-600">หน้า {page} / {totalPages}</span>
          <button
            suppressHydrationWarning
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </Card>
    </div>
  );
}
