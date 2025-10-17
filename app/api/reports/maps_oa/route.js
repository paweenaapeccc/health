import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/reports/maps_oa?search=...&page=1&pageSize=20
 */
export async function GET(req) {
  let db;
  try {
    db = await connectDB(); // ✅ เชื่อมต่อ pool
    const url = new URL(req.url);

    const search = (url.searchParams.get("search") || "").trim();
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(url.searchParams.get("pageSize") || "20", 10), 1),
      100
    );
    const offset = (page - 1) * pageSize;

    // where + params
    let where = "";
    let params = [];
    if (search) {
      const kw = `%${search}%`;
      where = `
        WHERE e.name LIKE ?
           OR e.citizenID LIKE ?
           OR e.phonNumber LIKE ?
           OR e.address LIKE ?
           OR e.subdistrict LIKE ?
           OR e.district LIKE ?
           OR e.province LIKE ?
      `;
      params = [kw, kw, kw, kw, kw, kw, kw];
    }

    // ✅ นับจำนวนทั้งหมด
    const [cntRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM elderly e ${where}`,
      params
    );
    const total = cntRows?.[0]?.total ?? 0;

    // ✅ ดึงข้อมูล OA ล่าสุด
    const [rows] = await db.execute(
      `
      WITH latest_assess AS (
        SELECT a.elderlyID, a.assessmentID, a.assessmentDate
        FROM healthassessment a
        INNER JOIN (
          SELECT elderlyID, MAX(assessmentDate) AS maxDate
          FROM healthassessment
          GROUP BY elderlyID
        ) m ON m.elderlyID = a.elderlyID AND m.maxDate = a.assessmentDate
      )
      SELECT
        e.elderlyID,
        e.userID,
        e.name,
        e.citizenID,
        e.phonNumber AS phone,
        e.birthDate,
        e.gender,
        e.address, e.subdistrict, e.district, e.province,
        NULLIF(TRIM(SUBSTRING_INDEX(e.latlong, ',', 1)), '') AS latitude,
        NULLIF(TRIM(SUBSTRING_INDEX(e.latlong, ',', -1)), '') AS longitude,
        a.assessmentID, a.assessmentDate,
        a.yesCount, a.stiffness, a.crepitus,
        a.bonyTenderness, a.bonyEnlargement, a.noWarmth
      FROM elderly e
      LEFT JOIN latest_assess la ON la.elderlyID = e.elderlyID
      LEFT JOIN healthassessment a ON a.assessmentID = la.assessmentID
      ${where}
      ORDER BY e.elderlyID DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    return NextResponse.json({ rows, page, pageSize, total });
  } catch (err) {
    console.error("GET /api/reports/maps_oa error:", err);
    return NextResponse.json({ error: "โหลดข้อมูลไม่สำเร็จ", detail: err.message }, { status: 500 });
  } finally {
    // ✅ ปิด connection ถ้าไม่ใช้ pool (หรือปล่อยคืน pool)
    if (db && db.release) db.release();
  }
}
