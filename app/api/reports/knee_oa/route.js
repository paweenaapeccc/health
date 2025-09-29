import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req) {
  const db = await connectDB();
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") || "1900-01-01";
  const end = searchParams.get("end") || "2100-01-01";

  try {
    // ดึงข้อมูลเพศ + อายุ (ณ วันประเมิน)
    const [rows] = await db.execute(
      `
      SELECT 
        e.gender,
        TIMESTAMPDIFF(YEAR, e.birthDate, h.assessmentDate) AS ageYears
      FROM healthassessment h
      JOIN elderly e ON h.elderlyID = e.elderlyID
      WHERE h.assessmentDate BETWEEN ? AND ?
      `,
      [start, end]
    );

    // เตรียม band
    const bands = ["60-69", "70-79", "80+"];
    const byGender = { male: {}, female: {}, unknown: {} };
    const totals = {};
    let grandTotal = 0;

    for (const b of bands) {
      byGender.male[b] = 0;
      byGender.female[b] = 0;
      byGender.unknown[b] = 0;
      totals[b] = 0;
    }

    // วนลูปใส่ค่า
    for (const row of rows) {
      const g =
        row.gender === "male"
          ? "male"
          : row.gender === "female"
          ? "female"
          : "unknown";

      let band = null;
      if (row.ageYears >= 60 && row.ageYears <= 69) band = "60-69";
      else if (row.ageYears >= 70 && row.ageYears <= 79) band = "70-79";
      else if (row.ageYears >= 80) band = "80+";

      if (band) {
        byGender[g][band]++;
        totals[band]++;
        grandTotal++;
      }
    }

    return NextResponse.json({
      bands,
      byGender,
      totals,
      grandTotal,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
