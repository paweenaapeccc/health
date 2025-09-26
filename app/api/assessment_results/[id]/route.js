// app/api/assessment_results/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const assessmentID = String(params?.id ?? "").trim().toUpperCase();

    // id ต้องเป็น ASM ตามด้วยเลข >= 3 หลัก เช่น ASM014, ASM1001
    if (!/^ASM\d{3,}$/.test(assessmentID)) {
      return NextResponse.json({ ok: false, message: "invalid id format" }, { status: 400 });
    }

    const db = await connectDB();

    // ดึงชื่อผู้สูงอายุ + ผลล่าสุด (ถ้ามีใน assessmentresults ใช้อันนั้น, ไม่งั้น fallback เป็น healthassessment.resultText)
    const [rows] = await db.execute(
      `
      SELECT
        ha.assessmentID,
        ha.elderlyID,
        e.name AS elderlyName,
        COALESCE(ar.as_results, ha.resultText)       AS resultText,
        COALESCE(ar.as_score,   ha.yesCount)         AS score
      FROM healthassessment ha
      LEFT JOIN elderly e
        ON e.elderlyID = ha.elderlyID
      LEFT JOIN assessmentresults ar
        ON ar.assessmentID = ha.assessmentID
      WHERE ha.assessmentID = ?
      ORDER BY ar.as_resultsID DESC
      LIMIT 1
      `,
      [assessmentID]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
    }

    const row = rows[0];
    return NextResponse.json(
      {
        ok: true,
        data: {
          assessmentID: row.assessmentID,
          elderlyID: row.elderlyID,
          elderlyName: row.elderlyName ?? "",
          resultText: row.resultText ?? "",
          score: row.score ?? 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/assessment_results/[id] error:", err);
    return NextResponse.json({ ok: false, message: "internal error" }, { status: 500 });
  }
}
