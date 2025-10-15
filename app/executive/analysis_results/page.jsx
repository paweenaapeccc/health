"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";

/** endpoint API */
const ENDPOINT = "/api/reports/analysis_results";

/** utils */
const toDateInput = (d) => new Date(d).toISOString().slice(0, 10);

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(rows, headers) {
  const head = headers.map((h) => csvEscape(h.label)).join(",");
  const body = rows
    .map((r) =>
      headers
        .map((h) => csvEscape(h.map ? h.map(r) : r[h.key] ?? ""))
        .join(",")
    )
    .join("\n");
  return head + "\n" + body;
}
function badgeClass(decision) {
  if (!decision) return "bg-gray-200 text-gray-700";
  if (decision.includes("ไปรับ")) return "bg-red-600 text-white";
  if (decision.includes("พิจารณา")) return "bg-yellow-500 text-white";
  return "bg-green-600 text-white";
}

function AnalysisResultsPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState(() =>
    toDateInput(Date.now() - 30 * 86400000)
  );
  const [dateTo, setDateTo] = useState(() => toDateInput(Date.now()));
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const url = new URL(ENDPOINT, window.location.origin);
      url.searchParams.set("page", p);
      url.searchParams.set("pageSize", pageSize);
      if (q) url.searchParams.set("search", q);
      if (dateFrom) url.searchParams.set("from", dateFrom);
      if (dateTo) url.searchParams.set("to", dateTo);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      setRows(Array.isArray(json) ? json : json.rows || []);
      setTotal(Array.isArray(json) ? json.length : json.total || 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const viewRows = useMemo(() => {
    return rows.map((r) => {
      const text = String(r.an_results || "");
      let decision = "";
      if (/^ให้/.test(text)) decision = "ให้รพ.ไปรับ";
      else if (/^พิจารณา/.test(text) || /^ญาติ/.test(text))
        decision = "พิจารณา/ญาติพามา";
      else if (/^เดิน/.test(text)) decision = "เดินทางเอง";
      return { ...r, decision };
    });
  }, [rows]);

  const exportCSV = () => {
    const headers = [
      { key: "recordID", label: "เลขบันทึก" },
      { key: "created_at", label: "วันที่" },
      { key: "elderlyID", label: "รหัสผู้สูงอายุ" },
      { key: "name", label: "ชื่อ" },
      { key: "citizenID", label: "เลขบัตร" },
      {
        key: "address",
        label: "ที่อยู่",
        map: (r) =>
          `${r.address || ""} ${r.subdistrict || ""} ${r.district || ""} ${
            r.province || ""
          }`.trim(),
      },
      { key: "an_results", label: "ผลการวิเคราะห์" },
      { key: "decision", label: "สรุป" },
    ];
    const csv = toCSV(viewRows, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_results_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">ผลการวิเคราะห์</h1>

      {/* filter */}
      <div className="bg-gradient-to-r from-teal-100 to-teal-200 p-4 rounded-2xl shadow">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">ค้นหา</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), load(1))}
              placeholder="ชื่อ/เลขบัตร/ที่อยู่"
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">จากวันที่</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">ถึงวันที่</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setPage(1);
                load(1);
              }}
              className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
            >
              ค้นหา
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-lg border hover:bg-white/70"
            >
              ส่งออก CSV
            </button>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="mt-6 rounded-2xl overflow-x-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">วันที่</th>
              <th className="p-3 text-left">เลขที่</th>
              <th className="p-3 text-left">ชื่อ</th>
              <th className="p-3 text-left">ที่อยู่</th>
              <th className="p-3 text-left">ผลวิเคราะห์</th>
              <th className="p-3 text-center">สรุป</th>
              <th className="p-3 text-center">แผนที่</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={7}>
                  กำลังโหลด...
                </td>
              </tr>
            ) : viewRows.length === 0 ? (
              <tr>
                <td className="p-4 text-center" colSpan={7}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              viewRows.map((r) => (
                <tr key={r.recordID} className="border-t">
                  <td className="p-3">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("th-TH", {
                          dateStyle: "medium",
                        })
                      : "-"}
                  </td>
                  <td className="p-3">{r.recordID}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.citizenID}</div>
                    <div className="text-xs text-gray-500">{r.phone}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {(r.address || "") +
                      (r.subdistrict ? ` ต.${r.subdistrict}` : "") +
                      (r.district ? ` อ.${r.district}` : "") +
                      (r.province ? ` จ.${r.province}` : "")}
                  </td>
                  <td className="p-3">{r.an_results}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                        r.decision
                      )}`}
                    >
                      {r.decision || "—"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {r.latitude && r.longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-xs"
                      >
                        เปิดแผนที่
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex justify-between mt-4 text-sm">
        <div>
          รวม {total} รายการ • หน้า {page}/{totalPages}
        </div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => {
              const p = Math.max(1, page - 1);
              setPage(p);
              load(p);
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const p = Math.min(totalPages, page + 1);
              setPage(p);
              load(p);
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AnalysisResultsPage), {
  ssr: false,
});
