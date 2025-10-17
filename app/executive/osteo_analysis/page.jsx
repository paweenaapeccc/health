"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useRef } from "react";

const ENDPOINT = "/api/reports/maps_oa";
const ELDERLY_API = "/api/elderly"; // ✅ endpoint สำหรับดึงข้อมูลรายบุคคล

/* ---------- Helper ---------- */
const toNumber = (v) =>
  v === null || v === undefined || v === "" ? null : Number(v);

function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((x) => x == null || Number.isNaN(Number(x))))
    return null;
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
function roadDistanceApprox(lat1, lon1, lat2, lon2) {
  const straight = haversineKm(lat1, lon1, lat2, lon2);
  return straight ? straight * 1.3 : null;
}
function calcYesCount(row) {
  const keys = [
    "stiffness",
    "crepitus",
    "bonyTenderness",
    "bonyEnlargement",
    "noWarmth",
  ];
  return keys.reduce((acc, k) => acc + (row?.[k] ? 1 : 0), 0);
}
function oaSeverity(yesCount) {
  if (yesCount >= 4) return "รุนแรง";
  if (yesCount >= 2) return "ปานกลาง";
  return "น้อย/ไม่มี";
}
function carePlan(severity) {
  switch (severity) {
    case "รุนแรง":
      return [
        "ออกกำลังกายเบา ๆ เช่น เดินหรือยืดเหยียด",
        "ตรวจข้อเข่าเดือนละครั้ง",
        "ให้โรงพยาบาลติดตามอาการต่อเนื่อง",
      ];
    case "ปานกลาง":
      return [
        "ออกกำลังกายเสริมกล้ามเนื้อขา",
        "ควบคุมน้ำหนัก",
        "ประเมินอาการทุก 3 เดือน",
      ];
    default:
      return [
        "ส่งเสริมการเคลื่อนไหว",
        "รับประทานอาหารครบ 5 หมู่",
        "ตรวจสุขภาพประจำปี",
      ];
  }
}

/* ---------- Main Page ---------- */
function OATravelAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("ทั้งหมด");
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personDetail, setPersonDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [hospitalLatLong] = useState("14.921865811051898,103.30055440886561");

  const tableRef = useRef(null);

  // ✅ โหลดข้อมูลผู้สูงอายุทั้งหมด
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(ENDPOINT, { cache: "no-store" });
        const json = await res.json();
        setRows(Array.isArray(json) ? json : json?.rows || []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ enrich
  const enriched = useMemo(() => {
    const [latStr, lngStr] = hospitalLatLong.split(",").map((x) => x.trim());
    const hLat = Number(latStr),
      hLng = Number(lngStr);
    return rows.map((r) => {
      const yes = calcYesCount(r);
      const sev = oaSeverity(yes);
      const dist = roadDistanceApprox(
        toNumber(r.latitude),
        toNumber(r.longitude),
        hLat,
        hLng
      );
      return { ...r, yesCount: yes, severity: sev, distanceKm: dist, plan: carePlan(sev) };
    });
  }, [rows]);

  const summary = useMemo(() => {
    const total = enriched.length;
    const severe = enriched.filter((r) => r.severity === "รุนแรง").length;
    const moderate = enriched.filter((r) => r.severity === "ปานกลาง").length;
    const low = enriched.filter((r) => r.severity === "น้อย/ไม่มี").length;
    return { total, severe, moderate, low };
  }, [enriched]);

  const filtered =
    filterSeverity === "ทั้งหมด"
      ? enriched
      : enriched.filter((r) => r.severity === filterSeverity);

  const handleFilterClick = (type) => {
    setFilterSeverity(type);
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ✅ โหลดข้อมูลรายบุคคล
  const fetchElderlyDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`${ELDERLY_API}/${id}`, { cache: "no-store" });
      const data = await res.json();
      setPersonDetail(data?.data || null);
    } catch {
      setPersonDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSelectPerson = (r) => {
    setSelectedPerson(r);
    fetchElderlyDetail(r.elderlyID); // ดึงข้อมูลเต็มตาม ID
  };

  return (
    <div className="min-h-screen  py-20">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          📊 วิเคราะห์ข้อมูลผู้สูงอายุเพื่อวางแผนการดูแล
        </h1>

        {/* ✅ Dashboard */}
        <section className="">
          <h2 className="text-lg font-semibold text-indigo-800 mb-4">
            ผลการวิเคราะห์เบื้องต้น
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {[
              {
                label: "รวมผู้สูงอายุทั้งหมด",
                count: summary.total,
                color: "black",
                type: "ทั้งหมด",
              },
              {
                label: "กลุ่มเสี่ยงรุนแรง",
                count: summary.severe,
                color: "red",
                type: "รุนแรง",
              },
              {
                label: "กลุ่มเสี่ยงปานกลาง",
                count: summary.moderate,
                color: "amber",
                type: "ปานกลาง",
              },
              {
                label: "กลุ่มเสี่ยงน้อย/ไม่มี",
                count: summary.low,
                color: "green",
                type: "น้อย/ไม่มี",
              },
            ].map((box, i) => (
              <div
                key={i}
                onClick={() => handleFilterClick(box.type)}
                className={`p-4 bg-${box.color}-50 rounded-xl border cursor-pointer transition hover:scale-105 ${
                  filterSeverity === box.type ? `ring-2 ring-${box.color}-400` : ""
                }`}
              >
                <p className={`text-2xl font-bold text-${box.color}-700`}>
                  {box.count}
                </p>
                <p>{box.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ✅ ตาราง */}
        <section ref={tableRef}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700">
              แสดงข้อมูล:{" "}
              {filterSeverity === "ทั้งหมด"
                ? "ทุกกลุ่ม"
                : `เฉพาะ${filterSeverity}`}
            </h3>
          </div>

          <div className="rounded-xl border overflow-x-auto shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="p-3 text-left">ชื่อ</th>
                  <th className="p-3 text-left">ที่อยู่</th>
                  <th className="p-3 text-center">ความรุนแรง</th>
                  <th className="p-3 text-center">แผนการดูแล</th>
                  <th className="p-3 text-center">ข้อมูลผู้สูงอายุ</th>
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
                      <td className="p-3 font-semibold text-gray-800">
                        {r.name}
                      </td>
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

                      {/* ✅ ปรับให้อยู่ตรงกลางแนวตั้ง + แนวนอน */}
                      <td className="p-3 text-xs text-center align-middle">
                        <ul className="w-[250px] mx-auto text-left list-disc list-inside space-y-1">
                          {r.plan.map((p, idx) => (
                            <li key={idx}>{p}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleSelectPerson(r)}
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

        {/* ✅ Modal รายละเอียดผู้สูงอายุ */}
        {selectedPerson && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
            onClick={() => {
              setSelectedPerson(null);
              setPersonDetail(null);
            }}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setSelectedPerson(null);
                  setPersonDetail(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                ข้อมูลผู้สูงอายุ
              </h2>

              {loadingDetail ? (
                <p className="text-center text-gray-500 py-4">กำลังโหลดข้อมูล...</p>
              ) : personDetail ? (
                <div className="space-y-2 text-sm text-gray-800">
                  <p><strong>ชื่อ-สกุล:</strong> {personDetail.name}</p>
                  <p><strong>เลขบัตรประชาชน:</strong> {personDetail.citizenID}</p>
                  <p><strong>เพศ: </strong>{personDetail.genderTh || '-'}</p>
                  <p><strong>วันเกิด:</strong> {personDetail.birthTh || '-'}</p>
                  <p><strong>อายุ:</strong> {personDetail.age} ปี</p>
                  <p><strong>โทร:</strong> {personDetail.phone}</p>
                  <p><strong>ที่อยู่:</strong> {personDetail.address}</p>
                  <p>
                    <strong>ตำบล/อำเภอ/จังหวัด:</strong>{" "}
                    {personDetail.subdistrict} / {personDetail.district} / {personDetail.province}
                  </p>
                  <p>
                    <strong>พิกัด:</strong>{" "}
                    {personDetail.latitude}, {personDetail.longitude}
                  </p>
                  <p><strong>ส่วนสูง:</strong> {personDetail.height} ซม.</p>
                  <p><strong>น้ำหนัก:</strong> {personDetail.weight} กก.</p>
                  <p><strong>โรคประจำตัว:</strong> {personDetail.disease || "-"}</p>
                  <p><strong>หมายเหตุ:</strong> {personDetail.note || "-"}</p>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  ไม่พบข้อมูลผู้สูงอายุ
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(OATravelAnalysisPage), { ssr: false });
