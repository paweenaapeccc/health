// app/api/reports/analysis_results/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

/**
 * ถ้าฐานข้อมูลของคุณมีคอลัมน์ r.created_at จริง ให้เปลี่ยนค่านี้เป็น true
 * แล้ว query จะใส่เงื่อนไขวันที่ให้โดยอัตโนมัติ
 */
const HAS_CREATED_AT = false;

export async function GET(req) {
  try {
    const db = await connectDB();
    const url = new URL(req.url);

    const search = (url.searchParams.get("search") || "").trim();
    const from = (url.searchParams.get("from") || "").trim(); // YYYY-MM-DD
    const to = (url.searchParams.get("to") || "").trim();     // YYYY-MM-DD
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(url.searchParams.get("pageSize") || "20", 10), 1),
      100
    );
    const offset = (page - 1) * pageSize;

    // ----- WHERE builder -----
    const whereParts = [];
    const params = [];

    if (search) {
      const kw = `%${search}%`;
      whereParts.push(
        `(
          r.recordID LIKE ? OR r.elderlyID LIKE ? OR r.an_results LIKE ?
          OR e.name LIKE ? OR e.citizenID LIKE ? OR e.phonNumber LIKE ?
          OR e.address LIKE ? OR e.subdistrict LIKE ? OR e.district LIKE ? OR e.province LIKE ?
        )`
      );
      params.push(kw, kw, kw, kw, kw, kw, kw, kw, kw, kw);
    }

    // ใส่ช่วงวันที่เฉพาะเมื่อมีคอลัมน์ created_at จริง ๆ
    if (HAS_CREATED_AT) {
      if (from) {
        whereParts.push(`DATE(r.created_at) >= ?`);
        params.push(from);
      }
      if (to) {
        whereParts.push(`DATE(r.created_at) <= ?`);
        params.push(to);
      }
    }
    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    // ----- COUNT สำหรับหน้า -----
    const [cntRows] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM elderlyhealthdataanalysis r
      LEFT JOIN elderly e ON e.elderlyID = r.elderlyID
      ${whereSQL}
      `,
      params
    );
    const total = cntRows?.[0]?.total ?? 0;

    // ----- SELECT รายการ -----
    // ถ้าไม่มี created_at ให้คืน NULL ชื่อเดียวกัน เพื่อให้หน้า UI ใช้ฟิลด์เดียวกันได้
    const createdAtSelect = HAS_CREATED_AT ? "r.created_at" : "NULL AS created_at";

    const [rows] = await db.execute(
      `
      SELECT
        r.recordID,
        ${createdAtSelect},
        r.executiveID,
        r.as_resultsID,
        r.elderlyID,
        r.an_results,

        e.name,
        e.citizenID,
        e.phonNumber AS phone,
        e.address, e.subdistrict, e.district, e.province,

        NULLIF(TRIM(SUBSTRING_INDEX(e.latlong, ',', 1)), '') AS latitude,
        NULLIF(TRIM(SUBSTRING_INDEX(e.latlong, ',', -1)), '') AS longitude
      FROM elderlyhealthdataanalysis r
      LEFT JOIN elderly e ON e.elderlyID = r.elderlyID
      ${whereSQL}
      ORDER BY ${HAS_CREATED_AT ? "r.created_at DESC, " : ""} r.recordID DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    return NextResponse.json({ rows, total, page, pageSize });
  } catch (err) {
    console.error("GET /api/reports/analysis_results error:", err);
    return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
