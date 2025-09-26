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
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

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
    const whereDate = start && end ? "AND ha.assessmentDate BETWEEN ? AND ?" : "";
    const params = [];
    if (start && end) params.push(start, end);

    const [rows] = await db.query(
      `
      SELECT e.gender,
             TIMESTAMPDIFF(YEAR, e.birthDate, CURDATE()) AS age
      FROM healthassessment ha
      JOIN elderly e ON e.elderlyID = ha.elderlyID
      WHERE (ha.yesCount >= 3 OR ha.resultText LIKE '%เข่าเสื่อม%')
      ${whereDate}
      `,
      params
    );

    const base = { male: {}, female: {}, unknown: {} };
    AGE_BANDS.forEach(b => {
      base.male[b.key] = 0; base.female[b.key] = 0; base.unknown[b.key] = 0;
    });
    const totals = Object.fromEntries(AGE_BANDS.map(b => [b.key, 0]));
    let grand = 0;

    const getBand = (age) => {
      for (const b of AGE_BANDS) if (age >= b.min && age <= b.max) return b.key;
      return "80+";
    };

    for (const r of rows) {
      const g = r.gender === "male" || r.gender === "female" ? r.gender : "unknown";
      const band = getBand(Number(r.age));
      base[g][band] += 1; totals[band] += 1; grand += 1;
    }

    return NextResponse.json({
      bands: AGE_BANDS.map(b => b.key),
      byGender: base,
      totals,
      grandTotal: grand,
      filter: { start, end },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
