// app/api/assessment/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    const db = await connectDB();
    const body = await req.json();

    let { elderlyID, stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth, userID } = body;

    if (!elderlyID) {
      return NextResponse.json({ error: "elderlyID required" }, { status: 400 });
    }

    if (!userID || userID === "null" || userID === "undefined") {
      userID = process.env.DEFAULT_USER_ID || "USR001";
      console.warn("⚠️ userID not found, fallback to", userID);
    }

    const yesCount = [stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth].filter(
      (x) => x === 1
    ).length;

    const resultText =
      yesCount >= 2
        ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
        : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";

    // ✅ บันทึกข้อมูลลงตาราง healthassessment
    await db.execute(
      `
      INSERT INTO healthassessment
        (userID, elderlyID, assessmentDate, stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth, yesCount, resultText)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userID,
        elderlyID,
        stiffness ?? 0,
        crepitus ?? 0,
        bonyTenderness ?? 0,
        bonyEnlargement ?? 0,
        noWarmth ?? 0,
        yesCount,
        resultText,
      ]
    );

    // ✅ ดึง assessmentID ล่าสุดที่ trigger เพิ่งสร้าง (เช่น ASM012)
    const [rows] = await db.execute(
      `
      SELECT assessmentID 
      FROM healthassessment
      WHERE userID = ? AND elderlyID = ?
      ORDER BY assessmentID DESC
      LIMIT 1
      `,
      [userID, elderlyID]
    );

    const assessmentID = rows?.[0]?.assessmentID || null;

    if (!assessmentID) {
      throw new Error("ไม่พบ assessmentID หลังการบันทึก");
    }

    // ✅ ส่งกลับให้ frontend ใช้ต่อ
    return NextResponse.json(
      {
        ok: true,
        message: "บันทึกสำเร็จ",
        assessmentID,
        yesCount,
        resultText,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
