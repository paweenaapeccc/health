import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const citizenID = searchParams.get("citizenID");

    if (!citizenID) {
      return NextResponse.json({ error: "citizenID required" }, { status: 400 });
    }

    const db = await connectDB();

    // ✅ 1. ตรวจสอบข้อมูลผู้สูงอายุ
    const [elderRows] = await db.execute(
      `SELECT elderlyID, name, citizenID FROM elderly WHERE citizenID = ?`,
      [citizenID]
    );

    if (elderRows.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const elderly = elderRows[0];

    // ✅ 2. ตรวจสอบผลการประเมินล่าสุดจาก healthassessment
    const [assessmentRows] = await db.execute(
      `
      SELECT 
        h.assessmentID,
        h.assessmentDate,
        h.yesCount,
        h.resultText
      FROM healthassessment h
      WHERE h.elderlyID = ?
      ORDER BY h.assessmentDate DESC
      LIMIT 1
      `,
      [elderly.elderlyID]
    );

    // ✅ 3. ถ้ามีผลการประเมิน ให้ส่งกลับพร้อมข้อมูลผู้สูงอายุ
    if (assessmentRows.length > 0) {
      return NextResponse.json({
        ok: true,
        exists: true,
        data: elderly,
        assessment: assessmentRows[0], // เพิ่มส่วนนี้
      });
    }

    // ✅ 4. ถ้ายังไม่เคยทำแบบประเมิน
    return NextResponse.json({
      ok: true,
      exists: true,
      data: elderly,
      assessment: null,
    });
  } catch (err) {
    console.error("GET /api/elderly/exists error:", err);
    return NextResponse.json(
      { error: err.message || "server error" },
      { status: 500 }
    );
  }
}
