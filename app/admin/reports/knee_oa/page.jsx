"use client";

import { useEffect, useMemo, useState } from "react";
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
   ✅ แปลงวันที่เป็นรูปแบบไทย (พ.ศ.)
------------------------------------------------------------ */
const toThaiDate = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear() + 543;
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
      "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
      "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    ];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${day} ${month} ${year}`;
  } catch {
    return "-";
  }
};

/* ------------------------------------------------------------
   ✅ แปลงเพศให้เป็นภาษาไทย
------------------------------------------------------------ */
const genderLabel = (g) =>
  g === "male" ? "ชาย" : g === "female" ? "หญิง" : "";

/* ------------------------------------------------------------
   ✅ หน้าเพจรายงานภาวะข้อเข่าเสื่อม
------------------------------------------------------------ */
export default function KneeOAReportPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  /* ------------------------------------------------------------
     ✅ โหลดข้อมูลจาก API
  ------------------------------------------------------------ */
  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);

      const res = await fetch(`/api/reports/knee_oa?${qs.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("โหลดข้อมูลล้มเหลว:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
     ✅ โหลดข้อมูลเมื่อ mount ครั้งแรก
  ------------------------------------------------------------ */
  useEffect(() => {
    setMounted(true);
    load();
  }, []);

  /* ------------------------------------------------------------
     ✅ เตรียมข้อมูลสำหรับกราฟ (เรียก useMemo ทุกครั้ง)
  ------------------------------------------------------------ */
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

  /* ------------------------------------------------------------
     ✅ สีของกราฟ
  ------------------------------------------------------------ */
  const COLOR_BY_GENDER = { male: "#4F46E5", female: "#EC4899" };
  const PIE_COLORS = ["#4F46E5", "#EC4899"];

  const riskColor = (risk) => {
    switch (risk) {
      case "เสี่ยงสูง":
        return "text-red-600 font-semibold";
      case "ไม่เสี่ยง":
        return "text-green-600 font-semibold";
      case "ยังไม่ประเมิน":
        return "text-gray-500";
      default:
        return "";
    }
  };


  /* ------------------------------------------------------------
     ✅ ฟังก์ชันดาวน์โหลด CSV — จัดรูปแบบตารางให้อ่านง่ายขึ้น
  ------------------------------------------------------------ */
  const downloadCSV = () => {
    if (!data) return;

    const lines = [];

    /* ---------- ส่วนหัวรายงาน ---------- */
    lines.push("รายงานภาวะข้อเข่าเสื่อม แยกตามเพศและช่วงอายุ");
    lines.push(`วันที่ออกรายงาน: ${toThaiDate(new Date())}`);
    lines.push(""); // เว้นบรรทัด

    /* ---------- ส่วนที่ 1: ตารางสรุป ---------- */
    const headers = ["เพศ", ...data.bands, "รวม"];
    lines.push(headers.join(","));
    lines.push("----------------------------------------------------------");

    Object.keys(data.byGender).forEach((g) => {
      const row = [
        genderLabel(g),
        ...data.bands.map((b) => data.byGender[g][b] || 0),
        Object.values(data.byGender[g]).reduce((a, b) => a + b, 0),
      ];
      lines.push(row.join(","));
    });

    lines.push(
      ["รวม", ...data.bands.map((b) => data.totals[b]), data.grandTotal].join(",")
    );

    lines.push("----------------------------------------------------------");
    lines.push("");
    lines.push("");
    lines.push("รายชื่อผู้สูงอายุและระดับความเสี่ยง");

    /* ---------- ส่วนที่ 2: รายชื่อผู้สูงอายุ ---------- */
    const detailHeaders = [
      "เลขบัตรประชาชน",
      "ชื่อ-สกุล",
      "เพศ",
      "อายุ (ปี)",
      "กลุ่มความเสี่ยง",
      "ผลการประเมินล่าสุด",
      "วันที่ประเมิน",
    ];
    lines.push(detailHeaders.join(","));
    lines.push("----------------------------------------------------------");

    data.list?.forEach((p, i) => {
      const row = [
        `="${p.citizenID}"`,
        p.name,
        genderLabel(p.gender),
        p.age,
        p.riskGroup || "-",
        p.resultText || "-",
        toThaiDate(p.assessmentDate),
      ];
      lines.push(row.join(","));
    });

    lines.push("----------------------------------------------------------");
    lines.push(`รวมทั้งหมด ${data.list?.length || 0} รายชื่อ`);

    /* ---------- สร้างไฟล์ CSV ---------- */
    const blob = new Blob([`\ufeff${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงานภาวะข้อเข่าเสื่อม-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  /* ------------------------------------------------------------
     ✅ เริ่ม Render UI (หลัง useMemo ทั้งหมด)
  ------------------------------------------------------------ */
  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 space-y-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            รายงานภาวะข้อเข่าเสื่อม แยกตามเพศและช่วงอายุ
          </h1>

          {/* ฟิลเตอร์ช่วงเวลา */}
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

            <div className="flex gap-2">
              <button
                onClick={load}
                className="px-4 py-2 rounded bg-blue-600 text-white shadow hover:bg-blue-700 transition"
              >
                ค้นหา
              </button>
              <button
                onClick={downloadCSV}
                disabled={!data}
                className="px-4 py-2 rounded border bg-gray-50 hover:bg-gray-100 transition"
              >
                ดาวน์โหลด CSV
              </button>
            </div>
          </div>

          {/* แสดงข้อมูล */}
          {loading ? (
            <div className="text-center py-6 text-gray-600">กำลังโหลดข้อมูล...</div>
          ) : !data ? (
            <div className="text-center text-red-600">โหลดข้อมูลไม่สำเร็จ</div>
          ) : (
            <>
              {/* ✅ กราฟแท่ง + วงกลม */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* กราฟแท่ง */}
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
                        <Bar dataKey="male" stackId="g" name="ชาย" fill={COLOR_BY_GENDER.male} />
                        <Bar dataKey="female" stackId="g" name="หญิง" fill={COLOR_BY_GENDER.female} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* กราฟวงกลม */}
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
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ✅ ตารางข้อมูล */}
              <div className="overflow-x-auto border rounded-lg bg-white">
                <h2 className="text-lg font-semibold p-4 border-b">
                  รายชื่อผู้สูงอายุและระดับความเสี่ยง
                </h2>
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border text-left">เลขบัตรประชาชน</th>
                      <th className="p-2 border text-left">ชื่อ-สกุล</th>
                      <th className="p-2 border text-left">เพศ</th>
                      <th className="p-2 border text-right">อายุ</th>
                      <th className="p-2 border text-left">กลุ่มความเสี่ยง</th>
                      <th className="p-2 border text-left">ผลการประเมินล่าสุด</th>
                      <th className="p-2 border text-left">วันที่ประเมิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.list?.map((p) => (
                      <tr key={p.elderlyID}>
                        <td className="p-2 border">{p.citizenID}</td>
                        <td className="p-2 border">{p.name}</td>
                        <td className="p-2 border">{genderLabel(p.gender)}</td>
                        <td className="p-2 border text-right">{p.age}</td>
                        <td className={`p-2 border ${riskColor(p.riskGroup)}`}>{p.riskGroup}</td>
                        <td className="p-2 border">{p.resultText}</td>
                        <td className="p-2 border">{toThaiDate(p.assessmentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
