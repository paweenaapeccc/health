import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const db = await connectDB();
    const body = await req.json();

    let { assessmentID = null, elderlyID, as_score, as_results } = body || {};

    // ✅ ตรวจค่า
    if (elderlyID == null) {
      return NextResponse.json({ message: "elderlyID required" }, { status: 400 });
    }

    as_score = parseInt(as_score, 10);
    if (Number.isNaN(as_score) || as_score < 0 || as_score > 5) {
      return NextResponse.json({ message: "as_score must be 0–5" }, { status: 400 });
    }

    as_results = String(as_results ?? "").trim().slice(0, 255);
    if (!as_results) {
      return NextResponse.json({ message: "as_results required" }, { status: 400 });
    }

    // ✅ insert ลงตาราง assessmentresults
    const [ret] = await db.execute(
      `INSERT INTO assessmentresults (assessmentID, elderlyID, as_score, as_results)
       VALUES (?, ?, ?, ?)`,
      [assessmentID, elderlyID, as_score, as_results]
    );

    return NextResponse.json(
      { success: true, as_resultsID: ret.insertId },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment_results error:", err);
    return NextResponse.json({ message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
