"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const ENDPOINT = "/api/reports/maps_oa";

/** ---------- Helpers ---------- **/
const toNumber = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((x) => x == null || Number.isNaN(Number(x)))) return null;
  const R = 6371;
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

/** helper แปลงค่าพิกัดให้ปลอดภัย */
function fmtCoord(val) {
  const num = Number(val);
  return isNaN(num) ? null : num.toFixed(5);
}

/** ---------- Main Page ---------- **/
function OATravelAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // ✅ ใช้ latlong เดียวเป็นหลัก
  const [hospitalLatLong, setHospitalLatLong] = useState("15.0055,103.1009");
  const [latErr, setLatErr] = useState("");
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
      setTotal(Array.isArray(json) ? json.length ?? 0 : json?.total ?? 0);
    } catch {
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
  }, []);

  // ✅ แยก latlong ออกเป็น lat/lng
  const parsedHospital = useMemo(() => {
    if (!hospitalLatLong.includes(",")) {
      setLatErr("รูปแบบพิกัดไม่ถูกต้อง (ตัวอย่าง: 15.0055,103.1009)");
      return { lat: null, lng: null };
    }
    const [latStr, lngStr] = hospitalLatLong.split(",").map((s) => s.trim());
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLatErr("ค่าพิกัดต้องเป็นตัวเลข เช่น 15.0055,103.1009");
      return { lat: null, lng: null };
    }
    setLatErr("");
    return { lat, lng };
  }, [hospitalLatLong]);

  const enriched = useMemo(() => {
    const { lat: hospitalLat, lng: hospitalLng } = parsedHospital;
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
  }, [rows, parsedHospital, maxSelfTravelKm, considerEscortKm, forcePickupKm]);

  const filtered = useMemo(() => {
    if (!q) return enriched;
    const kw = q.toLowerCase();
    return enriched.filter(
      (r) =>
        String(r.name || "").toLowerCase().includes(kw) ||
        String(r.citizenID || "").toLowerCase().includes(kw) ||
        String(r.address || "").toLowerCase().includes(kw)
    );
  }, [enriched, q]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8 space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-4">
          วิเคราะห์การเดินทางมาโรงพยาบาล
        </h1>

        {/* พิกัดโรงพยาบาล */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-700">
            🏥 พิกัดโรงพยาบาลบุรีรัมย์ (Lat, Long)
          </h2>
          <input
            type="text"
            value={hospitalLatLong}
            onChange={(e) => setHospitalLatLong(e.target.value)}
            placeholder="ตัวอย่าง: 15.0055,103.1009"
            className={`w-full border rounded-lg px-3 py-2 text-gray-800 ${
              latErr ? "border-red-400 focus:ring-red-300" : "focus:ring-indigo-300"
            }`}
          />
          {latErr && <p className="text-red-600 text-sm">{latErr}</p>}
        </section>

        {/* เกณฑ์ */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "ระยะเดินทางเองได้",
              value: maxSelfTravelKm,
              setter: setMaxSelfTravelKm,
              hint: "≤ ค่านี้ → เดินทางเอง",
            },
            {
              label: "ระยะพิจารณา/ญาติพามา",
              value: considerEscortKm,
              setter: setConsiderEscortKm,
              hint: "เกินเดินเอง แต่ ≤ ค่านี้ → พิจารณา",
            },
            {
              label: "ระยะที่ รพ. ต้องไปรับ",
              value: forcePickupKm,
              setter: setForcePickupKm,
              hint: "> ค่านี้ → ให้รพ.ไปรับ",
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">{item.label}</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => item.setter(Number(e.target.value))}
                  className="w-24 border rounded-lg px-2 py-1 text-center"
                />
                <span className="text-sm text-gray-600">กม.</span>
              </div>
              <span className="text-xs text-gray-500 mt-1">{item.hint}</span>
            </div>
          ))}
        </section>

        {/* ค้นหา */}
        <div className="flex flex-col md:flex-row gap-2 mt-6">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load({ page: 1 })}
            placeholder="เลขบัตรประชาชน"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={() => load({ page: 1 })}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow cursor-pointer"
          >
            ค้นหา
          </button>
        </div>

        {/* ตาราง */}
        <section>
          <div className="rounded-xl border overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3 text-left">ที่อยู่</th>
                  <th className="p-3 text-left">พิกัด</th>
                  <th className="p-3 text-right">ระยะทาง (กม.)</th>
                  <th className="p-3 text-center">คะแนน</th>
                  <th className="p-3 text-center">ความรุนแรง</th>
                  <th className="p-3 text-center">สรุป</th>
                  <th className="p-3 text-center">แผนที่</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center p-4">กำลังโหลด...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-4">ไม่พบข้อมูล</td></tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.citizenID}</div>
                        <div className="text-xs text-gray-500">{r.phone}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">{r.address}</td>
                      <td className="p-3 text-xs text-gray-700">
                        {fmtCoord(r.latitude) && fmtCoord(r.longitude)
                          ? `${fmtCoord(r.latitude)}, ${fmtCoord(r.longitude)}`
                          : "-"}
                      </td>
                      <td className="p-3 text-right">{r.distanceKm?.toFixed(2) ?? "-"}</td>
                      <td className="p-3 text-center">{r.yesCount}</td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            "px-2 py-1 rounded-lg text-xs font-semibold " +
                            (r.severity === "รุนแรง"
                              ? "bg-red-100 text-red-700"
                              : r.severity === "ปานกลาง"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700")
                          }
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={
                            "px-2 py-1 rounded-lg text-xs font-semibold " +
                            (r.decision === "ให้รพ.ไปรับ"
                              ? "bg-red-600 text-white"
                              : r.decision === "พิจารณา/ญาติพามา"
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white")
                          }
                        >
                          {r.decision}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-1">{r.reason}</div>
                      </td>
                      <td className="p-3 text-center">
                        {fmtCoord(r.latitude) && fmtCoord(r.longitude) ? (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
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
        </section>

        {/* pagination */}
        <div className="flex justify-between items-center text-sm mt-4">
          <span>
            รวม {total} รายการ • หน้า {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const p = Math.max(1, page - 1);
                setPage(p);
                load({ page: p });
              }}
              disabled={page <= 1}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                setPage(p);
                load({ page: p });
              }}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded-lg disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(OATravelAnalysisPage), { ssr: false });
