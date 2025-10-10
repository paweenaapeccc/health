import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db"; // ปรับ path ให้ตรงโปรเจ็กต์คุณ

// GET /api/elderly/exists?name=... [&citizenID=...] [&fuzzy=1]
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get("name") ?? "";
    const citizenID = searchParams.get("citizenID") ?? "";
    const fuzzy = searchParams.get("fuzzy") === "1"; // เปิดโหมด LIKE

    // ✨ normalize: ตัดช่องว่างหัวท้าย, รวมช่องว่างซ้อน, รองรับไทย
    const normalize = (s) =>
      String(s || "")
        .trim()
        .replace(/\s+/g, " "); // ช่องว่างหลายตัว -> 1 ตัว

    const name = normalize(rawName);

    if (!name && !citizenID) {
      return NextResponse.json(
        { ok: false, error: "ต้องระบุ name หรือ citizenID อย่างน้อย 1 อย่าง" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // 🔎 ถ้ามี citizenID ให้ค้นหาตรงๆ ก่อน (ชัดที่สุด)
    if (citizenID) {
      const [rows] = await db.execute(
        `
        SELECT elderlyID, name, citizenID
        FROM elderly
        WHERE citizenID = ?
        LIMIT 1
        `,
        [citizenID]
      );
      return NextResponse.json({ ok: true, exists: rows.length > 0, rows });
    }

    // 🔎 ค้นหาด้วยชื่อ
    // - เทียบแบบ normalize โดยไม่สนใจจำนวนช่องว่าง (REPLACE ช่วยอีกชั้น)
    // - ถ้า fuzzy=1 จะใช้ LIKE '%ชื่อ%'
    if (fuzzy) {
      const like = `%${name}%`;
      const [rows] = await db.execute(
        `
        SELECT elderlyID, name, citizenID
        FROM elderly
        WHERE REPLACE(name, '  ', ' ') LIKE ?
        LIMIT 20
        `,
        [like]
      );
      return NextResponse.json({ ok: true, exists: rows.length > 0, rows });
    } else {
      const [rows] = await db.execute(
        `
        SELECT elderlyID, name, citizenID
        FROM elderly
        WHERE REPLACE(name, '  ', ' ') = REPLACE(?, '  ', ' ')
        LIMIT 1
        `,
        [name]
      );
      return NextResponse.json({ ok: true, exists: rows.length > 0, rows });
    }
  } catch (err) {
    console.error("GET /api/elderly/exists error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
