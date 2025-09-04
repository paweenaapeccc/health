// app/api/assessment_results/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const assessmentId = Number(id);

    if (!Number.isFinite(assessmentId) || assessmentId <= 0) {
      return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
    }

    const db = await connectDB();

    const [rows] = await db.query(
      `
      SELECT
        ar.as_resultsID,
        ar.assessmentID,
        ar.elderlyID,
        ar.as_score,
        ar.as_results,
        e.name AS elderlyName   -- 👈 ใช้คอลัมน์ name
      FROM assessmentresults ar
      LEFT JOIN elderly e ON e.elderlyID = ar.elderlyID
      WHERE ar.assessmentID = ?
      LIMIT 1
      `,
      [assessmentId]
    );

    return NextResponse.json({ ok: true, data: rows?.[0] ?? null }, { status: 200 });
  } catch (err) {
    console.error("GET /api/assessment_results/[id] error:", err);
    return NextResponse.json({ ok: false, message: "internal error" }, { status: 500 });
  }
}
