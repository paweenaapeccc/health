import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const db = await connectDB();
    const body = await req.json();

    const { elderlyID, stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth, userID } = body;

    if (!elderlyID) {
      return NextResponse.json({ error: "elderlyID required" }, { status: 400 });
    }

    // คำนวณ yesCount และ resultText
    const yesCount = [stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth].filter((x) => x === 1).length;
    const resultText = yesCount >= 2
      ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
      : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";

    // Insert ลง healthassessment
    const [ret] = await db.execute(
      `INSERT INTO healthassessment
        (userID, elderlyID, assessmentDate, stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth, yesCount, resultText)
       VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        userID || null,
        elderlyID,
        stiffness,
        crepitus,
        bonyTenderness,
        bonyEnlargement,
        noWarmth,
        yesCount,
        resultText,
      ]
    );

    const assessmentID = ret.insertId; // ใช้ id ที่ DB เพิ่งสร้าง

    return NextResponse.json(
      { ok: true, assessmentID, yesCount, resultText },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
