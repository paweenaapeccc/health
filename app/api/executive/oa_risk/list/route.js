// ✅ นำเข้าให้ครบ
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";     // ตรวจเส้นทางให้ตรงโปรเจกต์คุณ
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const riskLabel = (k) =>
  k === 2 ? "เสี่ยงต่ำ" :
  k === 3 ? "เสี่ยงปานกลาง" :
  k === 4 ? "เสี่ยงสูง" : "เข้าข่ายชัดเจน";

function calcAge(b) {
  if (!b) return null;
  const d = new Date(b); if (isNaN(+d)) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

export async function GET(req) {
  try {
    const db = await connectDB(); // ✅ ต้องมีการ import

    // 🔐 ป้องกันหน้า executive
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ ok:false, error:"unauthorized" }, { status: 401 });
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    } catch {
      return NextResponse.json({ ok:false, error:"invalid token" }, { status: 401 });
    }

    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end   = url.searchParams.get("end");
    const search = (url.searchParams.get("search") || "").trim();
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(url.searchParams.get("pageSize") || "20", 10), 1), 100);
    const offset = (page - 1) * pageSize;

    const dateWhere = [];
    const dateParams = [];
    if (start) { dateWhere.push("DATE(assessmentDate) >= ?"); dateParams.push(start); }
    if (end)   { dateWhere.push("DATE(assessmentDate) <= ?"); dateParams.push(end); }
    const dateClause = dateWhere.length ? `AND ${dateWhere.join(" AND ")}` : "";

    // ✅ ใช้ชื่อตาม schema จริงของคุณ (phonNumber, citizenID)
    const baseSql = `
      FROM (
        SELECT ha.elderlyID, ha.yesCount, ha.assessmentDate
        FROM healthassessment ha
        JOIN (
          SELECT elderlyID, MAX(assessmentDate) AS last_date
          FROM healthassessment
          WHERE 1=1 ${dateClause || ""}
          GROUP BY elderlyID
        ) last ON last.elderlyID = ha.elderlyID AND last.last_date = ha.assessmentDate
        WHERE ha.yesCount BETWEEN 2 AND 5
      ) x
      JOIN elderly e ON e.elderlyID = x.elderlyID
      WHERE 1=1
    `;

    const params = [...dateParams];
    let searchClause = "";
    if (search) {
      const kw = `%${search}%`;
      searchClause = `
        AND (
          e.name LIKE ? OR e.citizenID LIKE ? OR e.phonNumber LIKE ?
          OR e.address LIKE ? OR e.subdistrict LIKE ? OR e.district LIKE ? OR e.province LIKE ?
        )
      `;
      params.push(kw, kw, kw, kw, kw, kw, kw);
    }

    const [cnt] = await db.execute(`SELECT COUNT(*) AS total ${baseSql} ${searchClause}`, params);
    const total = cnt?.[0]?.total ?? 0;

    const [rows] = await db.execute(
      `
      SELECT
        x.elderlyID,
        e.name, e.gender, e.birthDate,
        e.citizenID, e.phonNumber, e.district, e.province,
        x.assessmentDate AS lastAssessmentDate,
        x.yesCount
      ${baseSql}
      ${searchClause}
      ORDER BY x.assessmentDate DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    const data = rows.map(r => ({
      elderlyID: r.elderlyID,
      name: r.name,
      gender: r.gender === "male" ? "ชาย" : r.gender === "female" ? "หญิง" : "ไม่ระบุ",
      age: calcAge(r.birthDate),
      citizenID: r.citizenID || "-",
      phone: r.phonNumber || "-",
      district: r.district || "-",
      province: r.province || "-",
      lastAssessmentDate: r.lastAssessmentDate,
      yesCount: r.yesCount,
      riskLabel: riskLabel(r.yesCount),
    }));

    return NextResponse.json({ ok:true, range:{start,end}, page, pageSize, total, rows:data }, { status: 200 });
  } catch (e) {
    console.error("oa_risk list error:", e);
    // ✅ ส่ง JSON เสมอเพื่อไม่ให้ฝั่ง client json() พัง
    return NextResponse.json({ ok:false, error: e?.message || "server error" }, { status: 500 });
  }
}
