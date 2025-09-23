import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// ---------- GET /api/assessment ----------
// ---------- POST /api/assessment ----------
export async function POST(req) {
  try {
    const db = await connectDB();

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

    const s = Number(!!Number(stiffness));
    const c = Number(!!Number(crepitus));
    const bt = Number(!!Number(bonyTenderness));
    const be = Number(!!Number(bonyEnlargement));
    const nw = Number(!!Number(noWarmth));

    const yesCount = s + c + bt + be + nw;

    // ✅ ตัด "(ตอบ 'ใช่' ≥ 2 ข้อ)" ออก
    const resultText =
      yesCount >= 2
        ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
        : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";

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

