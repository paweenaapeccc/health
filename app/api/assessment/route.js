import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// ---------- GET /api/assessment ----------
export async function GET(req) {
  try {
    const db = await connectDB();
    const url = new URL(req.url);

    const elderlyID = url.searchParams.get("elderlyID");
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(url.searchParams.get("pageSize") || "20", 10), 1),
      100
    );
    const offset = (page - 1) * pageSize;

    const where = [];
    const params = [];

    if (elderlyID) {
      where.push("ha.elderlyID = ?");
      params.push(Number(elderlyID));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // นับจำนวน
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM healthassessment ha ${whereSql}`,
      params
    );
    const total = countRows?.[0]?.total ?? 0;

    // ดึงข้อมูล
    const [rows] = await db.execute(
      `
      SELECT
        ha.assessmentID, ha.userID, ha.elderlyID, ha.assessmentDate,
        ha.stiffness, ha.crepitus, ha.bonyTenderness, ha.bonyEnlargement, ha.noWarmth,
        ha.yesCount, ha.resultText,
        e.name AS elderlyName
      FROM HealthAssessment ha
      LEFT JOIN elderly e ON e.elderlyID = ha.elderlyID
      ${whereSql}
      ORDER BY ha.assessmentID DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    return NextResponse.json({
      ok: true,
      data: rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    });
  } catch (error) {
    console.error("GET /api/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ---------- POST /api/assessment ----------
export async function POST(req) {
  try {
    const db = await connectDB();

    // ตรวจ JWT เอา userID
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    let payload;
    try {
      ({ payload } = await jwtVerify(token, secret));
    } catch {
      return NextResponse.json({ error: "เซสชันไม่ถูกต้อง" }, { status: 401 });
    }

    const userID = payload?.userId ?? payload?.id ?? payload?.userID ?? null;
    if (!userID) {
      return NextResponse.json(
        { error: "ไม่พบ userID ในเซสชัน" },
        { status: 401 }
      );
    }

    // รับ body
    const body = await req.json();
    const {
      elderlyID,
      assessmentDate,
      stiffness = 0,
      crepitus = 0,
      bonyTenderness = 0,
      bonyEnlargement = 0,
      noWarmth = 0,
    } = body || {};

    if (!elderlyID) {
      return NextResponse.json({ error: "กรุณาระบุ elderlyID" }, { status: 400 });
    }

    // แปลงค่าเป็น 0/1
    const s = Number(!!Number(stiffness));
    const c = Number(!!Number(crepitus));
    const bt = Number(!!Number(bonyTenderness));
    const be = Number(!!Number(bonyEnlargement));
    const nw = Number(!!Number(noWarmth));

    // คำนวณ yesCount + resultText
    const yesCount = s + c + bt + be + nw;
    const resultText =
      yesCount >= 2
        ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม (ตอบ 'ใช่' ≥ 2 ข้อ)"
        : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";

    // insert
    const [ret] = await db.execute(
      `
      INSERT INTO healthassessment
        (userID, elderlyID, assessmentDate,
         stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth,
         yesCount, resultText)
      VALUES
        (?, ?, COALESCE(?, CURRENT_DATE),
         ?, ?, ?, ?, ?,
         ?, ?)
      `,
      [userID, elderlyID, assessmentDate || null, s, c, bt, be, nw, yesCount, resultText]
    );

    const assessmentID = ret?.insertId;

    return NextResponse.json(
      { ok: true, assessmentID, yesCount, resultText },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/assessment error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
