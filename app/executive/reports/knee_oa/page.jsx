"use client";

import { useEffect, useMemo, useState, Suspense, useTransition } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ------------------------------------------------------------
   ✅ Helper ฟังก์ชัน
------------------------------------------------------------ */
const toThaiDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear() + 543;
    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${year}`;
  } catch {
    return "-";
  }
};

const genderLabel = (g) =>
  g === "male" ? "ชาย" : g === "female" ? "หญิง" : "";

const riskLabel = (count) => {
  if (count >= 4) return "เสี่ยงสูง";
  if (count >= 2) return "เสี่ยงปานกลาง";
  return "เสี่ยงน้อย";
};

const riskColor = (risk) => {
  switch (risk) {
    case "เสี่ยงสูง":
      return "text-red-600 font-semibold";
    case "เสี่ยงปานกลาง":
      return "text-yellow-600 font-semibold";
    case "เสี่ยงน้อย":
      return "text-green-600 font-semibold";
    default:
      return "";
  }
};

/* ------------------------------------------------------------
   ✅ หน้าแสดงรายงาน
------------------------------------------------------------ */
export default function KneeOAReportPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("ทั้งหมด");
  const [isPending, startTransition] = useTransition();

  // ✅ โหลดข้อมูลจาก API
  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);

      const res = await fetch(`/api/reports/knee_oa?${qs.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const json = await res.json();

      startTransition(() => setData(json));
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  const barData = useMemo(() => {
    if (!data) return [];
    return data.bands.map((band) => ({
      band,
      male: data.byGender?.male?.[band] ?? 0,
      female: data.byGender?.female?.[band] ?? 0,
    }));
  }, [data]);

  const pieGenderData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.byGender || {}).map(([g, obj]) => ({
      name: genderLabel(g),
      value: Object.values(obj).reduce((a, b) => a + b, 0),
    }));
  }, [data]);

  const PIE_COLORS = ["#4F46E5", "#EC4899"];

  if (!mounted) return null;

  /* ------------------------------------------------------------
     ✅ ฟังก์ชันดาวน์โหลด CSV (แยกเพศ + อายุ + ความเสี่ยง)
  ------------------------------------------------------------ */
  const downloadCSV = (rows, riskGroup) => {
    if (!rows?.length) return;

    const getBand = (age) => {
      if (age < 70) return "60–69";
      if (age < 80) return "70–79";
      return "80+";
    };

    // ✅ สรุปกลุ่มเพศ + อายุ + ความเสี่ยง
    const grouped = {};
    rows.forEach((p) => {
      const gender = genderLabel(p.gender);
      const band = getBand(p.age);
      const risk = riskLabel(p.yesCount);
      const key = `${gender}_${band}_${risk}`;
      if (!grouped[key]) grouped[key] = { gender, band, risk, count: 0 };
      grouped[key].count++;
    });

    const headers = ["เพศ", "ช่วงอายุ", "กลุ่มความเสี่ยง", "จำนวน"];
    const summaryLines = [
      headers.join(","),
      ...Object.values(grouped).map((g) =>
        [g.gender, g.band, g.risk, g.count].join(",")
      ),
    ];

    // ✅ แยกข้อมูลตามเพศ
    const males = rows.filter((p) => p.gender === "male");
    const females = rows.filter((p) => p.gender === "female");

    const makeDetailSection = (title, list) => {
      if (!list.length) return "";
      const header = [
        "เลขบัตรประชาชน",
        "ชื่อ-สกุล",
        "เพศ",
        "อายุ",
        "กลุ่มความเสี่ยง",
        "ผลการประเมินล่าสุด",
        "วันที่ประเมิน",
      ].join(",");
      const lines = list.map((p) =>
        [
          p.citizenID,
          `"${p.name}"`,
          genderLabel(p.gender),
          p.age,
          riskLabel(p.yesCount),
          `"${p.resultText}"`,
          toThaiDate(p.assessmentDate),
        ].join(",")
      );
      return [`---- รายละเอียด${title} ----`, header, ...lines, ""].join("\n");
    };

    const csvContent = [
      "สรุปตามเพศ ช่วงอายุ และความเสี่ยง",
      ...summaryLines,
      "",
      makeDetailSection("เพศชาย", males),
      makeDetailSection("เพศหญิง", females),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `risk_summary_${riskGroup}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------
     ✅ ตารางรายกลุ่ม (แยกเพศ)
  ------------------------------------------------------------ */
  const renderRiskTable = (riskGroup) => {
    const filtered = data?.list?.filter(
      (p) => riskLabel(p.yesCount) === riskGroup
    );
    if (!filtered?.length) return null;

    const males = filtered.filter((p) => p.gender === "male");
    const females = filtered.filter((p) => p.gender === "female");

    const renderGenderTable = (genderTitle, list) => {
      if (!list.length) return null;
      return (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-blue-700">
            ▪ เพศ{genderTitle} ({list.length} คน)
          </h3>
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border text-left">เลขบัตรประชาชน</th>
                <th className="p-2 border text-left">ชื่อ-สกุล</th>
                <th className="p-2 border text-right">อายุ</th>
                <th className="p-2 border text-left">ผลการประเมินล่าสุด</th>
                <th className="p-2 border text-left">วันที่ประเมิน</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.elderlyID} className="hover:bg-gray-50">
                  <td className="p-2 border">{p.citizenID}</td>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border text-right">{p.age}</td>
                  <td className="p-2 border">{p.resultText}</td>
                  <td className="p-2 border">{toThaiDate(p.assessmentDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    return (
      <div
        key={riskGroup}
        className="overflow-x-auto border rounded-lg bg-white mb-8 transition-all"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            กลุ่มความเสี่ยง:{" "}
            <span className={riskColor(riskGroup)}>{riskGroup}</span>
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              จำนวนทั้งหมด {filtered.length} คน
            </span>
            <button
              onClick={() => downloadCSV(filtered, riskGroup)}
              className="px-4 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm shadow"
            >
              ดาวน์โหลด CSV
            </button>
          </div>
        </div>

        <div className="p-4">
          {renderGenderTable("ชาย", males)}
          {renderGenderTable("หญิง", females)}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------
     ✅ UI หลัก
  ------------------------------------------------------------ */
  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 space-y-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            รายงานภาวะข้อเข่าเสื่อม แยกตามกลุ่มความเสี่ยง
          </h1>

          {/* ฟิลเตอร์วันที่ */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end justify-center">
            <div>
              <label className="block text-sm mb-1">วันที่เริ่ม</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">ถึงวันที่</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
            <button
              onClick={load}
              className={`px-4 py-2 rounded text-white shadow transition ${
                isPending || loading
                  ? "bg-gray-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isPending || loading ? "กำลังโหลด..." : "ค้นหา"}
            </button>
          </div>

          {/* กราฟ */}
          <Suspense fallback={<div className="text-center py-4">📊 กำลังโหลดกราฟ...</div>}>
            {!data ? (
              <div className="text-center text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="col-span-2 border rounded-lg p-4 bg-white shadow">
                  <div className="font-semibold mb-2">สถิติแยกตามช่วงอายุ</div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="band" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="male" name="ชาย" fill="#4F46E5" />
                        <Bar dataKey="female" name="หญิง" fill="#EC4899" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-white shadow">
                  <div className="font-semibold mb-2">สัดส่วนตามเพศ</div>
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
                            <Cell
                              key={index}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </Suspense>

          {/* ปุ่มกรอง */}
          <div className="flex flex-wrap justify-center gap-3">
            {["ทั้งหมด", "เสี่ยงสูง", "เสี่ยงปานกลาง", "เสี่ยงน้อย"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRisk(r)}
                className={`px-5 py-2 rounded-lg shadow text-white transition ${
                  r === "เสี่ยงสูง"
                    ? "bg-red-600 hover:bg-red-700"
                    : r === "เสี่ยงปานกลาง"
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : r === "เสี่ยงน้อย"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 hover:bg-gray-700"
                } ${selectedRisk === r ? "ring-4 ring-offset-2" : ""}`}
              >
                {r === "ทั้งหมด" ? "แสดงทั้งหมด" : `กลุ่ม${r}`}
              </button>
            ))}
          </div>

          {/* ตาราง */}
          <Suspense fallback={<div className="text-center py-4">📄 กำลังโหลดตาราง...</div>}>
            {selectedRisk === "ทั้งหมด" ? (
              <>
                {renderRiskTable("เสี่ยงสูง")}
                {renderRiskTable("เสี่ยงปานกลาง")}
                {renderRiskTable("เสี่ยงน้อย")}
              </>
            ) : (
              renderRiskTable(selectedRisk)
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
