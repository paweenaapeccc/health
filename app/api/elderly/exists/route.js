import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

// GET /api/elderly/exists?name=...
export async function GET(req) {
  try {
    const url = new URL(req.url);
    // รองรับทั้ง name และ q เผื่อเผลอส่งมาคนละชื่อ
    const raw = url.searchParams.get("name") ?? url.searchParams.get("q") ?? "";
    const input = String(raw || "")
      .normalize("NFC")          // normalize ยูนิโค้ด
      .replace(/\s+/g, " ")      // บีบช่องว่างให้เหลือช่องเดียว
      .trim();

    if (!input) {
      // มีพารามิเตอร์แต่เป็นค่าว่าง -> ตอบ 200 แต่ exists:false แทน 400
      return NextResponse.json({ exists: false, message: "empty name" });
    }

    const db = await connectDB();

    // เตรียมตัวแปรเพื่อเปรียบเทียบโดยลบช่องว่างทั้งหมด (กันกรณีมี/ไม่มีช่องว่าง)
    const noSpace = input.replace(/\s+/g, "");

    // MySQL 8+ ใช้ REPLACE ได้กับทั้งคอลัมน์และพารามิเตอร์
    // ค้นหา 3 เงื่อนไข: ตรงตัวหลัง trim, ตรงตัวแบบลบช่องว่าง, และ LIKE (contains)
    const [rows] = await db.execute(
      `
      SELECT elderlyID, name
      FROM elderly
      WHERE
        TRIM(name) = ? OR
        REPLACE(name, ' ', '') = ? OR
        name LIKE ?
      LIMIT 1
      `,
      [input, noSpace, `%${input}%`]
    );

    if (rows && rows.length) {
      const r = rows[0];
      return NextResponse.json({
        exists: true,
        elderlyID: r.elderlyID,
        name: r.name,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("GET /api/elderly/exists error:", err);
    // ส่งเป็น 200 + exists:false เพื่อให้ฝั่งหน้าบ้านแสดงข้อความได้ ไม่แตกด้วย 400
    return NextResponse.json({ exists: false, error: "internal_error" });
  }
}
