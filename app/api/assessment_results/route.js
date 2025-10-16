import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

/** แปลงเป็นจำนวนเต็ม (หรือคืน NaN ถ้าแปลงไม่ได้) */
function toInt(v) {
  if (v === null || v === undefined || v === "") return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export async function POST(req) {
  // ---- ตรวจ Content-Type และ body ----
  const ctype = req.headers.get("content-type") || "";
  if (!ctype.includes("application/json")) {
    return NextResponse.json(
      { message: "Content-Type ต้องเป็น application/json" },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Body ต้องเป็น JSON ที่ถูกต้อง" },
      { status: 400 }
    );
  }

  // ---- ดึงค่าจาก body ----
  // assessmentID = optional (FK ไป healthassessment.assessmentID)
  // elderlyID    = required
  // as_score     = required (0–5)
  // as_results   = required (ไม่ว่าง)
  let {
    assessmentID = null,
    elderlyID,
    as_score,
    as_results,
  } = body || {};

  // ---- Validation ชั้นแรก ----
  if (elderlyID == null || String(elderlyID).trim() === "") {
    return NextResponse.json({ message: "elderlyID required" }, { status: 400 });
  }

  as_score = toInt(as_score);
  if (!Number.isFinite(as_score) || as_score < 0 || as_score > 5) {
    return NextResponse.json({ message: "as_score must be 0–5" }, { status: 400 });
  }

  as_results = String(as_results ?? "").trim();
  if (!as_results) {
    return NextResponse.json({ message: "as_results required" }, { status: 400 });
  }

  try {
    const db = await connectDB();

    // ---- ตรวจว่า assessmentID (ถ้ามี) อยู่จริงไหม ----
    // *สำคัญ*: ห้ามโยน undefined เข้า params เด็ดขาด → ใช้ guard ก่อน
    let validAssessmentId = null;
    if (assessmentID != null && String(assessmentID).trim() !== "") {
      const [chk] = await db.execute(
        "SELECT assessmentID FROM healthassessment WHERE assessmentID = ? LIMIT 1",
        [assessmentID] // ตรงนี้ปลอดภัยแล้วเพราะไม่ใช่ undefined
      );
      if (!Array.isArray(chk) || chk.length === 0) {
        return NextResponse.json(
          { message: "assessmentID not found in healthassessment" },
          { status: 400 }
        );
      }
      validAssessmentId = assessmentID; // ใช้ค่าที่ตรวจผ่าน
    }

    // ---- บันทึกลง assessmentresults ----
    // ปรับชื่อตาราง/คอลัมน์หากของคุณสะกดต่างกัน
  const [ret] = await db.execute(
  `
  INSERT INTO assessmentresults
    (assessmentID, elderlyID, as_score, as_results)
  VALUES (?, ?, ?, ?)
  `,
  [
    validAssessmentId,
    elderlyID,
    as_score,
    as_results,
  ]
);


    return NextResponse.json(
      {
        message: "saved",
        id: ret?.insertId ?? null,
        data: {
          assessmentID: validAssessmentId,
          elderlyID,
          as_score,
          as_results,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment_results error:", err);
    return NextResponse.json(
      {
        message: "Internal error",
        // ช่วยดีบักหน้างาน: แต่อย่าเปิดใช้ในโปรดักชันถ้าเสี่ยงข้อมูล
        detail: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}

// ---------- GET /api/assessment_results?elderlyID=... ----------
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const elderlyID = searchParams.get("elderlyID");

  if (!elderlyID) {
    return NextResponse.json({ message: "elderlyID required" }, { status: 400 });
  }

  try {
    const db = await connectDB();
    const [rows] = await db.execute(
      `
      SELECT 
        ar.id AS resultID,
        ar.assessmentID,
        ar.elderlyID,
        e.name AS elderlyName,
        ar.as_score,
        ar.as_results,
        h.assessmentDate
      FROM assessmentresults ar
      LEFT JOIN healthassessment h ON ar.assessmentID = h.assessmentID
      LEFT JOIN elderly e ON ar.elderlyID = e.elderlyID
      WHERE ar.elderlyID = ?
      ORDER BY ar.id DESC
      LIMIT 1
      `,
      [elderlyID]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "no result found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("GET /api/assessment_results error:", err);
    return NextResponse.json(
      { message: "Internal error", detail: err.message },
      { status: 500 }
    );
  }
}
