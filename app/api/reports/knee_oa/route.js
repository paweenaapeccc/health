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
    // ✅ ตรวจสอบ token (กันเข้าถึงโดยไม่ได้ล็อกอิน)
    const token = (await cookies()).get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ error: "เซสชันไม่ถูกต้อง" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const db = await connectDB();

    // ✅ ดึงข้อมูลผู้สูงอายุ + ผลประเมินล่าสุด
    const [rows] = await db.query(`
      SELECT 
        e.elderlyID,
        e.name,
        e.gender,
        TIMESTAMPDIFF(YEAR, e.birthDate, CURDATE()) AS age,
        ha.resultText,
        ha.yesCount,
        ha.assessmentDate
      FROM elderly e
      LEFT JOIN (
        SELECT elderlyID, resultText, yesCount, assessmentDate
        FROM healthassessment
        WHERE assessmentDate = (
          SELECT MAX(h2.assessmentDate) 
          FROM healthassessment h2 
          WHERE h2.elderlyID = healthassessment.elderlyID
        )
      ) ha ON e.elderlyID = ha.elderlyID
      ORDER BY e.elderlyID
    `);

    // ✅ เตรียมข้อมูลสรุป
    const base = { male: {}, female: {}, unknown: {} };
    AGE_BANDS.forEach((b) => {
      base.male[b.key] = 0;
      base.female[b.key] = 0;
      base.unknown[b.key] = 0;
    });

    const totals = Object.fromEntries(AGE_BANDS.map((b) => [b.key, 0]));
    let grand = 0;

    const getBand = (age) => {
      for (const b of AGE_BANDS)
        if (age >= b.min && age <= b.max) return b.key;
      return "80+";
    };

    // ✅ จัดกลุ่มความเสี่ยงและรวมสถิติ
    const resultData = rows.map((r) => {
      const g =
        r.gender === "male"
          ? "male"
          : r.gender === "female"
          ? "female"
          : "unknown";
      const band = getBand(Number(r.age));

      const riskGroup = !r.assessmentDate
        ? "ยังไม่ประเมิน"
        : r.yesCount >= 3 || (r.resultText || "").includes("เข่าเสื่อม")
        ? "เสี่ยงสูง"
        : "ไม่เสี่ยง";

      base[g][band] += 1;
      totals[band] += 1;
      grand += 1;

      return {
        elderlyID: r.elderlyID,
        name: r.name,
        gender: r.gender,
        age: r.age,
        riskGroup,
        resultText: r.resultText || "-",
        assessmentDate: r.assessmentDate || "-",
      };
    });

    return NextResponse.json({
      bands: AGE_BANDS.map((b) => b.key),
      byGender: base,
      totals,
      grandTotal: grand,
      list: resultData,
    });
  } catch (err) {
    console.error("Knee OA API error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
