"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const RiskPill = ({ label }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium
    ${label==="เสี่ยงต่ำ" ? "bg-emerald-100 text-emerald-800" :
      label==="เสี่ยงปานกลาง" ? "bg-amber-100 text-amber-800" :
      label==="เสี่ยงสูง" ? "bg-orange-100 text-orange-800" :
      "bg-rose-100 text-rose-800"}`}>
    {label}
  </span>
);

export default function ExecutiveOARiskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data,setData] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [exporting,setExporting] = useState(false);

  const fetchJsonSafe = async (url) => {
    const res = await fetch(url, { cache:"no-store" });
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { throw new Error(text || `HTTP ${res.status}`); }
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };

  const load = async () => {
    setLoading(true); setError("");
    try{
      const json = await fetchJsonSafe(`/api/executive/oa_risk/${id}`);
      setData(json);
    }catch(e){ setError(e.message || "เกิดข้อผิดพลาด"); setData(null); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ if(id) load(); },[id]);

  const timeline = (data?.timeline || []).slice().reverse();
  const latest = data?.latest;

  // ---------- Export CSV (Individual) ----------
  const escapeCSV = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // ครอบด้วย " ถ้ามีเครื่องหมายคำพูด/คอมม่า/บรรทัดใหม่
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const toCSVIndividual = (d) => {
    const p = d?.profile || {};
    const latest = d?.latest || null;

    const profileHeaders = [
      "elderlyID","ชื่อ-สกุล","เพศ","อายุ","ที่อยู่",
      "ผลล่าสุด-วันที่","ผลล่าสุด-ตอบใช่(ข้อ)","ผลล่าสุด-ระดับเสี่ยง","คำแนะนำล่าสุด"
    ];
    const profileRow = [
      p.elderlyID || "", p.name || "", p.gender || "", (p.age ?? ""),
      p.address || "",
      latest?.date ? latest.date.slice(0,10) : "",
      (latest?.yesCount ?? ""),
      latest?.riskLabel || "",
      (d?.advice || "")
    ].map(escapeCSV).join(",");

    const historyHeaders = ["วันที่","ตอบใช่(ข้อ)","ระดับเสี่ยง","สรุป"];
    const historyRows = (d?.timeline || []).map(r =>
      [ r.date ? r.date.slice(0,10) : "", (r.yesCount ?? ""), r.riskLabel || "", r.resultText || "" ]
      .map(escapeCSV).join(",")
    );

    // ใส่ BOM ให้ Excel อ่าน UTF-8 ถูกต้อง
    return "\ufeff" + [
      profileHeaders.join(","), profileRow,
      "", // เว้นบรรทัด
      "ประวัติการประเมิน",
      historyHeaders.join(","), ...historyRows
    ].join("\n");
  };

  const handleExport = () => {
    try{
      setExporting(true);
      const csv = toCSVIndividual(data || {});
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data?.profile?.elderlyID || "elderly"}_oa_detail.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };
  // --------------------------------------------

  return (
      <div className="max-w-5xl mx-auto">
        {/* การ์ดใหญ่ครอบทั้งหมด */}
        <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">ข้อมูลรายบุคคล</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={!data?.ok || exporting}
                className="px-4 py-2 rounded-xl border bg-white shadow hover:bg-gray-50 disabled:opacity-50"
                title="ส่งออกข้อมูลรายบุคคลเป็น CSV"
              >
                {exporting ? "กำลังส่งออก..." : "Export CSV"}
              </button>
              <button onClick={()=>router.back()} className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50">
                ← กลับ
              </button>
            </div>
          </div>

          {error && <div className="text-rose-600">⚠️ {error}</div>}
          {loading && <div className="text-gray-500 animate-pulse">กำลังโหลด...</div>}

          {!loading && data?.ok && (
            <>
              {/* Profile */}
              <div>
                <div className="text-lg font-semibold">{data.profile?.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  เพศ: {data.profile?.gender} · อายุ: {data.profile?.age ?? "-"}
                </div>
                <div className="text-sm text-gray-600">ที่อยู่: {data.profile?.address || "-"}</div>
              </div>

              {/* Latest */}
              <div>
                <div className="font-semibold mb-2">ผลล่าสุด</div>
                {latest ? (
                  <ul className="text-sm space-y-1">
                    <li>วันที่: {latest.date?.slice(0,10)}</li>
                    <li>ตอบ “ใช่”: {latest.yesCount} ข้อ</li>
                    <li>ระดับเสี่ยง: <RiskPill label={latest.riskLabel}/></li>
                    {latest.resultText && <li>สรุป: {latest.resultText}</li>}
                    <li className="pt-2">คำแนะนำ: {data.advice}</li>
                  </ul>
                ) : (
                  <div className="text-sm">ยังไม่มีข้อมูลประเมิน</div>
                )}
              </div>

              {/* Timeline chart */}
              <div>
                <div className="font-semibold mb-3">แนวโน้มจำนวน “ใช่” ตามเวลา</div>
                <div className="w-full h-72">
                  <ResponsiveContainer>
                    <LineChart data={timeline.map(x=>({ ...x, dateLabel: x.date?.slice(0,10) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dateLabel" />
                      <YAxis domain={[0,5]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="yesCount" name="จำนวน 'ใช่' (ข้อ)" stroke="#2563eb" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* History table */}
              <div>
                <div className="font-semibold mb-3">ประวัติการประเมิน (ล่าสุด → เก่าสุด)</div>
                <div className="overflow-x-auto">
                  <table className="min-w-[560px] w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-sm text-gray-600">
                        <th className="px-4 py-3 border-b">วันที่</th>
                        <th className="px-4 py-3 border-b text-right">ตอบ “ใช่”</th>
                        <th className="px-4 py-3 border-b">ระดับเสี่ยง</th>
                        <th className="px-4 py-3 border-b">สรุป</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.timeline || []).map(r=>(
                        <tr key={r.assessmentID} className="hover:bg-sky-50/50">
                          <td className="px-4 py-3 border-b">{r.date?.slice(0,10)}</td>
                          <td className="px-4 py-3 border-b text-right">{r.yesCount}</td>
                          <td className="px-4 py-3 border-b"><RiskPill label={r.riskLabel}/></td>
                          <td className="px-4 py-3 border-b">{r.resultText || "-"}</td>
                        </tr>
                      ))}
                      {(!data?.timeline || data.timeline.length===0) && (
                        <tr><td className="px-4 py-10 text-center text-gray-500" colSpan={4}>ไม่มีข้อมูล</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
}
