import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req, { params }) {
  try {
    const db = await connectDB();
    const { id } = params; // <-- assessmentID

    if (!id) {
      return NextResponse.json({ message: "assessmentID required" }, { status: 400 });
    }

    const [rows] = await db.execute(
      `SELECT ar.as_resultsID, ar.assessmentID, ar.elderlyID, 
              ar.as_score, ar.as_results, 
              e.name AS elderlyName
       FROM assessmentresults ar
       LEFT JOIN elderly e ON ar.elderlyID = e.elderlyID
       WHERE ar.assessmentID = ?
       ORDER BY ar.as_resultsID DESC
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "ไม่พบผลลัพธ์" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (err) {
    console.error("GET /api/assessment_results/[id] error:", err);
    return NextResponse.json({ message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
