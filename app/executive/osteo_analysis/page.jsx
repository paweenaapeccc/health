"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const ENDPOINT = "/api/reports/maps_oa";
const ELDERLY_API = "/api/elderly";

function toNumber(v) {
  return v === null || v === undefined || v === "" ? null : Number(v);
}

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
const roadDistanceApprox = (lat1, lon1, lat2, lon2) =>
  haversineKm(lat1, lon1, lat2, lon2) * 1.3 || null;

const calcYesCount = (r) =>
  ["stiffness", "crepitus", "bonyTenderness", "bonyEnlargement", "noWarmth"].reduce(
    (a, k) => a + (r?.[k] ? 1 : 0),
    0
  );

const oaSeverity = (c) => (c >= 4 ? "รุนแรง" : c >= 2 ? "ปานกลาง" : "น้อย/ไม่มี");
const carePlan = (s) =>
  s === "รุนแรง"
    ? [
        "ออกกำลังกายเบา ๆ เช่น เดินหรือยืดเหยียด",
        "ตรวจข้อเข่าเดือนละครั้ง",
        "ให้โรงพยาบาลติดตามอาการต่อเนื่อง",
      ]
    : s === "ปานกลาง"
    ? ["ออกกำลังกายเสริมกล้ามเนื้อขา", "ควบคุมน้ำหนัก", "ประเมินอาการทุก 3 เดือน"]
    : ["ส่งเสริมการเคลื่อนไหว", "รับประทานอาหารครบ 5 หมู่", "ตรวจสุขภาพประจำปี"];

function OATravelAnalysisPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ทั้งหมด");
  const [summary, setSummary] = useState({ total: 0, severe: 0, moderate: 0, low: 0 });

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const hospitalLatLong = "14.921865811051898,103.30055440886561";
  const tableRef = useRef(null);

  // ✅ โหลดข้อมูลหลัก
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(ENDPOINT, { cache: "no-store", signal: controller.signal });
        const json = await res.json();
        const data = Array.isArray(json) ? json : json?.rows || [];

        const [hLat, hLng] = hospitalLatLong.split(",").map((x) => Number(x.trim()));
        const enriched = data.map((r) => {
          const yes = calcYesCount(r);
          const sev = oaSeverity(yes);
          return {
            ...r,
            yesCount: yes,
            severity: sev,
            distanceKm: roadDistanceApprox(toNumber(r.latitude), toNumber(r.longitude), hLat, hLng),
            plan: carePlan(sev),
          };
        });

        // ✅ รวมสรุป
        setSummary({
          total: enriched.length,
          severe: enriched.filter((r) => r.severity === "รุนแรง").length,
          moderate: enriched.filter((r) => r.severity === "ปานกลาง").length,
          low: enriched.filter((r) => r.severity === "น้อย/ไม่มี").length,
        });
        setRows(enriched);
      } catch (e) {
        if (e.name !== "AbortError") console.error("load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const filtered =
    filter === "ทั้งหมด" ? rows : rows.filter((r) => r.severity === filter);

  const handleFilter = useCallback((t) => {
    setFilter(t);
    tableRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ✅ โหลดข้อมูลรายบุคคลเฉพาะเมื่อเปิด modal
  const fetchDetail = useCallback(async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${ELDERLY_API}/${id}`, { cache: "no-store" });
      const data = await res.json();
      setDetail(data?.data || null);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const openModal = (r) => {
    setSelected(r);
    fetchDetail(r.elderlyID);
  };

  const closeModal = () => {
    setSelected(null);
    setDetail(null);
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border p-8 space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          📊 วิเคราะห์ข้อมูลผู้สูงอายุเพื่อวางแผนการดูแล
        </h1>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          {[
            { label: "รวมทั้งหมด", count: summary.total, color: "black", type: "ทั้งหมด" },
            { label: "รุนแรง", count: summary.severe, color: "red", type: "รุนแรง" },
            { label: "ปานกลาง", count: summary.moderate, color: "amber", type: "ปานกลาง" },
            { label: "น้อย/ไม่มี", count: summary.low, color: "green", type: "น้อย/ไม่มี" },
          ].map((b, i) => (
            <div
              key={i}
              onClick={() => handleFilter(b.type)}
              className={`p-4 bg-${b.color}-50 rounded-xl border cursor-pointer hover:scale-105 transition ${
                filter === b.type ? `ring-2 ring-${b.color}-400` : ""
              }`}
            >
              <p className={`text-2xl font-bold text-${b.color}-700`}>{b.count}</p>
              <p>{b.label}</p>
            </div>
          ))}
        </div>

        {/* ตาราง */}
        <section ref={tableRef}>
          <div className="flex justify-between mb-2 text-gray-700 font-medium">
            แสดง: {filter === "ทั้งหมด" ? "ทุกกลุ่ม" : `เฉพาะ${filter}`}
          </div>

          <div className="rounded-xl border overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3 text-left">ที่อยู่</th>
                  <th className="p-3 text-center">ความรุนแรง</th>
                  <th className="p-3 text-center">แผนการดูแล</th>
                  <th className="p-3 text-center">ข้อมูล</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-4">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-semibold">{r.name}</td>
                      <td className="p-3">{r.address}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-lg ${
                            r.severity === "รุนแรง"
                              ? "bg-red-100 text-red-700"
                              : r.severity === "ปานกลาง"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-left align-middle">
                        <ul className="list-disc list-inside space-y-1">
                          {r.plan.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openModal(r)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                        >
                          ข้อมูลผู้สูงอายุ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-center mb-4">ข้อมูลผู้สูงอายุ</h2>
              {loadingDetail ? (
                <p className="text-center text-gray-500 py-4">กำลังโหลด...</p>
              ) : detail ? (
                <div className="space-y-2 text-sm text-gray-800">
                  <p><b>ชื่อ:</b> {detail.name}</p>
                  <p><b>เลขบัตร:</b> {detail.citizenID}</p>
                  <p><b>เพศ:</b> {detail.genderTh || "-"}</p>
                  <p><b>อายุ:</b> {detail.age} ปี</p>
                  <p><b>โทร:</b> {detail.phone}</p>
                  <p><b>ที่อยู่:</b> {detail.address}</p>
                  <p><b>โรคประจำตัว:</b> {detail.disease || "-"}</p>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">ไม่พบข้อมูล</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(OATravelAnalysisPage), { ssr: false });
