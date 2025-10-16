import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db";

const AGE_BANDS = [
  { key: "60-69", min: 60, max: 69 },
  { key: "70-79", min: 70, max: 79 },
  { key: "80+", min: 80, max: 200 },
];

export async function GET(req) {
  try {
    // ✅ ตรวจสอบ token (เพื่อป้องกันการเข้าถึงโดยไม่ได้ login)
    const token = (await cookies()).get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ error: "เซสชันไม่ถูกต้อง" }, { status: 401 });
    }

    // ✅ อ่านค่าพารามิเตอร์ช่วงเวลา (optional)
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start") || "1900-01-01";
    const end = searchParams.get("end") || "2100-12-31";

    const db = await connectDB();

    // ✅ ดึงข้อมูลผู้สูงอายุ + ผลประเมินล่าสุด (เฉพาะในช่วงที่เลือก)
    const [rows] = await db.query(
      `
      SELECT 
        e.elderlyID,
        e.name,
        e.citizenID,
        e.gender,
        TIMESTAMPDIFF(YEAR, e.birthDate, CURDATE()) AS age,
        ha.resultText,
        ha.yesCount,
        ha.assessmentDate
      FROM elderly e
      LEFT JOIN (
        SELECT h1.elderlyID, h1.resultText, h1.yesCount, h1.assessmentDate
        FROM healthassessment h1
        INNER JOIN (
          SELECT elderlyID, MAX(assessmentDate) AS latestDate
          FROM healthassessment
          WHERE assessmentDate BETWEEN ? AND ?
          GROUP BY elderlyID
        ) latest
        ON h1.elderlyID = latest.elderlyID AND h1.assessmentDate = latest.latestDate
      ) ha ON e.elderlyID = ha.elderlyID
      ORDER BY e.elderlyID
      `,
      [start, end]
    );

    // ✅ สร้างโครงสร้างเริ่มต้นสำหรับเพศและช่วงอายุ
    const base = { male: {}, female: {} };
    AGE_BANDS.forEach((b) => {
      base.male[b.key] = 0;
      base.female[b.key] = 0;
    });

    const totals = Object.fromEntries(AGE_BANDS.map((b) => [b.key, 0]));
    let grand = 0;

    // ✅ ฟังก์ชันหาช่วงอายุ
    const getBand = (age) => {
      for (const b of AGE_BANDS)
        if (age >= b.min && age <= b.max) return b.key;
      return "80+";
    };

    // ✅ ประมวลผลข้อมูล
    const resultData = rows.map((r) => {
      // ใช้เฉพาะ male / female เท่านั้น
      const g = r.gender === "male" ? "male" : "female";
      const band = getBand(Number(r.age));

      // ✅ ระบุระดับความเสี่ยง
      const riskGroup = !r.assessmentDate
        ? "ยังไม่ประเมิน"
        : r.yesCount >= 3 || (r.resultText || "").includes("เข่าเสื่อม")
        ? "เสี่ยงสูง"
        : "ไม่เสี่ยง";

      // ✅ รวมจำนวนในกลุ่ม
      base[g][band] += 1;
      totals[band] += 1;
      grand += 1;

      return {
        elderlyID: r.elderlyID,
        name: r.name,
        citizenID: r.citizenID,
        gender: r.gender,
        age: r.age,
        riskGroup,
        resultText: r.resultText || "-",
        assessmentDate: r.assessmentDate || "-",
      };
    });

    // ✅ ส่งข้อมูลกลับให้ frontend
    return NextResponse.json({
      bands: AGE_BANDS.map((b) => b.key),
      byGender: base,
      totals,
      grandTotal: grand,
      list: resultData,
    });
  } catch (err) {
    console.error("GET /api/reports/knee_oa error:", err);
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
