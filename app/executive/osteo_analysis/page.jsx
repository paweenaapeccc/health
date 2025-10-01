"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

/** ---------- CONFIG: ใช้ API เดิม ไม่แตะ backend ---------- **/
const ENDPOINT = "/api/reports/maps_oa";

/** ---------- HELPERS ---------- **/
const toNumber = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((x) => x == null || Number.isNaN(Number(x)))) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function calcYesCount(row) {
  if (typeof row?.yesCount === "number") return row.yesCount;
  const keys = ["stiffness", "crepitus", "bonyTenderness", "bonyEnlargement", "noWarmth"];
  return keys.reduce((acc, k) => acc + (row?.[k] ? 1 : 0), 0);
}

function oaSeverity(yesCount) {
  if (yesCount >= 4) return "รุนแรง";
  if (yesCount >= 2) return "ปานกลาง";
  return "น้อย/ไม่มี";
}

function decideTravel({ distanceKm, severity, t }) {
  if (distanceKm == null) return { decision: "ต้องตรวจสอบ", reason: "ไม่มีพิกัด" };
  const far = distanceKm > t.maxSelfTravelKm;
  const midFar = distanceKm > t.considerEscortKm;

  if (distanceKm > t.forcePickupKm || (severity === "รุนแรง" && far)) {
    return { decision: "ให้รพ.ไปรับ", reason: "OA รุนแรงหรือระยะไกล" };
  }
  if (severity === "ปานกลาง" || midFar) {
    return { decision: "พิจารณา/ญาติพามา", reason: "OA ปานกลางหรือระยะกลาง" };
  }
  return { decision: "เดินทางเอง", reason: "ใกล้ + OA น้อย" };
}

/** ---------- PAGE (Client-only) ---------- **/
function OATravelAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  // pagination (รองรับรูปแบบ { rows, total })
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // พิกัด รพ. + เกณฑ์
  const [hospitalLat, setHospitalLat] = useState(14.9948);
  const [hospitalLng, setHospitalLng] = useState(103.1039);
  const [maxSelfTravelKm, setMaxSelfTravelKm] = useState(5);
  const [considerEscortKm, setConsiderEscortKm] = useState(10);
  const [forcePickupKm, setForcePickupKm] = useState(20);

  const thresholds = { maxSelfTravelKm, considerEscortKm, forcePickupKm };

  const load = async (opt = {}) => {
    setLoading(true);
    try {
      const url = new URL(ENDPOINT, window.location.origin);
      url.searchParams.set("page", String(opt.page ?? page));
      url.searchParams.set("pageSize", String(pageSize));
      if (q) url.searchParams.set("search", q);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json();
      setRows(Array.isArray(json) ? json : json?.rows || []);
      setTotal(Array.isArray(json) ? (json.length ?? 0) : json?.total ?? 0);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enriched = useMemo(() => {
    return rows.map((r) => {
      const yes = calcYesCount(r);
      const sev = oaSeverity(yes);
      const dist = haversineKm(
        toNumber(r?.latitude),
        toNumber(r?.longitude),
        toNumber(hospitalLat),
        toNumber(hospitalLng)
      );
      const { decision, reason } = decideTravel({ distanceKm: dist, severity: sev, t: thresholds });
      return { ...r, yesCount: yes, severity: sev, distanceKm: dist, decision, reason };
    });
  }, [rows, hospitalLat, hospitalLng, maxSelfTravelKm, considerEscortKm, forcePickupKm]);

  const filtered = useMemo(() => {
    if (!q) return enriched;
    const kw = q.toLowerCase();
    return enriched.filter(
      (r) =>
        String(r.name || "").toLowerCase().includes(kw) ||
        String(r.citizenID || "").toLowerCase().includes(kw) ||
        String(r.phone || r.phonNumber || "").toLowerCase().includes(kw) ||
        String(r.address || "").toLowerCase().includes(kw) ||
        String(r.subdistrict || "").toLowerCase().includes(kw) ||
        String(r.district || "").toLowerCase().includes(kw) ||
        String(r.province || "").toLowerCase().includes(kw)
    );
  }, [enriched, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">
        วิเคราะห์การเดินทางมารพ. (ใช้ผลประเมิน OA + พิกัดบ้าน)
      </h1>

      {/* Controls */}
      <div
        className="bg-gradient-to-r from-teal-100 to-teal-200 p-4 rounded-2xl shadow border"
        suppressHydrationWarning
      >
        {/* พิกัดโรงพยาบาล */}
        <label className="text-sm text-gray-700 font-semibold block mb-2">
          พิกัดโรงพยาบาล & เกณฑ์
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 mb-1">ละติจูด (Latitude)</span>
            <input
              type="number"
              step="0.000001"
              value={hospitalLat}
              onChange={(e) => setHospitalLat(Number(e.target.value))}
              className="border rounded-lg px-3 py-2"
              placeholder="เช่น 14.9948"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-600 mb-1">ลองจิจูด (Longitude)</span>
            <input
              type="number"
              step="0.000001"
              value={hospitalLng}
              onChange={(e) => setHospitalLng(Number(e.target.value))}
              className="border rounded-lg px-3 py-2"
              placeholder="เช่น 103.1039"
            />
          </div>
        </div>

        {/* เกณฑ์ตัดสินใจ (อธิบายชัดเจน) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {/* เดินเอง */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 font-medium">ระยะเดินทางเองได้</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={maxSelfTravelKm}
                onChange={(e) => setMaxSelfTravelKm(Math.max(1, Number(e.target.value)))}
                className="w-24 border rounded-lg px-2 py-1 text-center"
              />
              <span className="text-sm">กม.</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">
              ใกล้กว่าหรือเท่าค่านี้ → ผู้สูงอายุ “เดินทางเอง”
            </span>
          </div>

          {/* พิจารณา */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 font-medium">ระยะพิจารณา/ญาติพามา</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={maxSelfTravelKm}
                value={considerEscortKm}
                onChange={(e) =>
                  setConsiderEscortKm(Math.max(maxSelfTravelKm, Number(e.target.value)))
                }
                className="w-24 border rounded-lg px-2 py-1 text-center"
              />
              <span className="text-sm">กม.</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">
              เกินระยะเดินเอง แต่ไม่เกินค่านี้ → “พิจารณา/ญาติพามา”
            </span>
          </div>

          {/* ไปรับ */}
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 font-medium">ระยะที่ รพ. ต้องไปรับ</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={considerEscortKm}
                value={forcePickupKm}
                onChange={(e) => setForcePickupKm(Math.max(considerEscortKm, Number(e.target.value)))}
                className="w-24 border rounded-lg px-2 py-1 text-center"
              />
              <span className="text-sm">กม.</span>
            </div>
            <span className="text-xs text-gray-600 mt-1">
              มากกว่าค่านี้ → “ให้ รพ. ไปรับ”
            </span>
          </div>
        </div>

        {/* ค้นหา */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="col-span-3 md:col-span-1 flex flex-col">
            <label className="text-sm text-gray-700 font-medium">ค้นหา (ชื่อ/เลขบัตร/ที่อยู่)</label>
            <div className="flex gap-2 mt-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setPage(1), load({ page: 1 }))}
                placeholder="เช่น นางสมศรี / 1234 / ในเมือง"
                className="flex-1 border rounded-lg px-3 py-2"
              />
              <button
                onClick={() => { setPage(1); load({ page: 1 }); }}
                className="px-4 py-2 rounded-lg bg-black text-white hover:opacity-90"
              >
                ค้นหา
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ตารางผลวิเคราะห์ */}
      <div className="mt-6 rounded-2xl overflow-x-auto border bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white text-gray-900 border-b">
              <th className="p-3 text-left">ชื่อ</th>
              <th className="p-3 text-left">ที่อยู่</th>
              <th className="p-3 text-left">พิกัด</th>
              <th className="p-3 text-right">ระยะทาง (กม.)</th>
              <th className="p-3 text-center">คะแนน OA</th>
              <th className="p-3 text-center">ความรุนแรง</th>
              <th className="p-3 text-center">สรุป</th>
              <th className="p-3 text-center">แผนที่</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center" colSpan={8}>กำลังโหลด...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="p-4 text-center" colSpan={8}>ไม่พบข้อมูล</td></tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t bg-white hover:bg-gray-100"
                >
                  <td className="p-3">
                    <div className="font-medium">{r.name || "-"}</div>
                    <div className="text-xs text-gray-500">{r.citizenID || ""}</div>
                    <div className="text-xs text-gray-500">{r.phone || r.phonNumber || ""}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">
                      {r.address || "-"} {r.subdistrict ? `ต.${r.subdistrict}` : ""} {r.district ? `อ.${r.district}` : ""} {r.province ? `จ.${r.province}` : ""}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs">
                      {r.latitude && r.longitude
                        ? `${Number(r.latitude).toFixed(6)}, ${Number(r.longitude).toFixed(6)}`
                        : "-"}
                    </div>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {r.distanceKm == null ? "-" : r.distanceKm.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">{r.yesCount}</td>
                  <td className="p-3 text-center">
                    <span
                      className={
                        "px-2 py-1 rounded-xl text-xs font-semibold shadow-sm " +
                        (r.severity === "รุนแรง"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : r.severity === "ปานกลาง"
                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200")
                      }
                    >
                      {r.severity}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={
                          "px-2 py-1 rounded-lg text-xs font-semibold shadow " +
                          (r.decision === "ให้รพ.ไปรับ"
                            ? "bg-red-600 text-white"
                            : r.decision === "พิจารณา/ญาติพามา"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-600 text-white")
                        }
                      >
                        {r.decision}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">{r.reason}</div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {r.latitude && r.longitude ? (
                      <a
                        className="text-blue-600 underline text-xs"
                        href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm">
        <div>รวม {total} รายการ • หน้า {page}/{totalPages}</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); load({ page: p }); }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ก่อนหน้า
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); load({ page: p }); }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}

/** ปิด SSR เพื่อกัน Hydration mismatch */
export default dynamic(() => Promise.resolve(OATravelAnalysisPage), { ssr: false });
