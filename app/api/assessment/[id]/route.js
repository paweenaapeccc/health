// app/api/assessment_results/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // ปรับ path ให้ตรงโปรเจกต์คุณ

export async function GET(req, { params }) {
  try {
    // ✅ ต้อง await ก่อน
    const { id } = await params;

    const assessmentId = Number(id);
    if (!Number.isFinite(assessmentId) || assessmentId <= 0) {
      return NextResponse.json({ message: "invalid id" }, { status: 400 });
    }

    const db = await connectDB();

    // ตัวอย่าง query – ปรับตาม schema ของคุณ
    const [rows] = await db.query(
      "SELECT * FROM assessment_results WHERE assessment_id = ? LIMIT 1",
      [assessmentId]
    );

    return NextResponse.json(rows?.[0] ?? null, { status: 200 });
  } catch (err) {
    console.error("GET /api/assessment_results/[id] error:", err);
    return NextResponse.json({ message: "internal error" }, { status: 500 });
  }
}
