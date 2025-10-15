// app/api/elderly/exists/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const citizenID = (searchParams.get("citizenID") || "").trim();

    // ✅ ตรวจสอบว่ามีการส่งเลขบัตรเข้ามาหรือไม่
    if (!citizenID) {
      return NextResponse.json(
        { ok: false, exists: false, message: "กรุณาระบุเลขบัตรประชาชน" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // ✅ ใช้ LIMIT 1 เพื่อให้ query เร็วขึ้น
    const [rows] = await db.execute(
      `SELECT elderlyID, citizenID, name 
       FROM elderly 
       WHERE citizenID = ? 
       LIMIT 1`,
      [citizenID]
    );

    // ✅ ถ้ามีข้อมูล
    if (rows.length > 0) {
      const row = rows[0];
      return NextResponse.json(
        {
          ok: true,
          exists: true,
          data: {
            elderlyID: row.elderlyID,
            citizenID: row.citizenID,
            name: row.name,
          },
        },
        { status: 200 }
      );
    }

    // ✅ ถ้าไม่พบข้อมูล
    return NextResponse.json(
      { ok: true, exists: false, message: "ไม่พบข้อมูลในระบบ" },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/elderly/exists error:", err);
    return NextResponse.json(
      { ok: false, exists: false, message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
