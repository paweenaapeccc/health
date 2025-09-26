// app/api/assessment_results/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const db = await connectDB();
    const body = await req.json();

    let { assessmentID, elderlyID, as_score, as_results } = body || {};

    // --- validate ---
    if (!assessmentID || !elderlyID) {
      return NextResponse.json(
        { message: "assessmentID and elderlyID required" },
        { status: 400 }
      );
    }
    assessmentID = String(assessmentID).trim().toUpperCase();
    if (!/^ASM\d{3,}$/.test(assessmentID)) {
      return NextResponse.json(
        { message: "assessmentID must match ASM### pattern" },
        { status: 400 }
      );
    }
    as_score = Number.parseInt(as_score, 10);
    if (Number.isNaN(as_score) || as_score < 0 || as_score > 5) {
      return NextResponse.json({ message: "as_score must be 0–5" }, { status: 400 });
    }
    as_results = String(as_results ?? "").trim().slice(0, 255);
    if (!as_results) {
      return NextResponse.json({ message: "as_results required" }, { status: 400 });
    }

    // --- confirm ว่ามี assessment นี้จริงก่อน (กัน FK ล้ม) ---
    const [[exist]] = await db.execute(
      "SELECT 1 FROM healthassessment WHERE assessmentID = ? LIMIT 1",
      [assessmentID]
    );
    if (!exist) {
      return NextResponse.json(
        { message: `assessmentID ${assessmentID} not found` },
        { status: 404 }
      );
    }

    // --- insert ---
    const [ret] = await db.execute(
      `INSERT INTO assessmentresults (assessmentID, elderlyID, as_score, as_results)
       VALUES (?, ?, ?, ?)`,
      [assessmentID, elderlyID, as_score, as_results]
    );

    return NextResponse.json(
      { success: true, as_resultsID: ret.insertId, assessmentID },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment_results error:", err);
    return NextResponse.json(
      { message: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
