import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

function to01(v) {
  if (v === 1 || v === "1" || v === true || v === "true") return 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["y", "yes", "ใช่"].includes(s)) return 1;
  }
  return 0;
}

export async function POST(req) {
  let db;
  try {
    db = await connectDB();
    const body = await req.json();

    // --- รับ param ได้หลายแบบ ---
    let {
      elderlyID,
      name,                // ✅ เผื่อส่งมาแค่ชื่อ
      userID = null,
      answers,
      stiffness,
      crepitus,
      bonyTenderness,
      bonyEnlargement,
      noWarmth,
    } = body || {};

    // ถ้าไม่มี elderlyID แต่มี name ให้ค้นใน DB เอา elderlyID มาใช้
    if ((!elderlyID || String(elderlyID).trim() === "") && name) {
      const norm = String(name).trim().replace(/\s+/g, " ");
      const [rowsByName] = await db.execute(
        `
        SELECT elderlyID, name FROM elderly
        WHERE REPLACE(name,'  ',' ') = REPLACE(?, '  ', ' ')
        LIMIT 1
        `,
        [norm]
      );
      if (rowsByName.length) {
        elderlyID = rowsByName[0].elderlyID;
      }
    }

    // ไม่มี elderlyID จริง ๆ → ตอบ 400
    if (!elderlyID || String(elderlyID).trim() === "") {
      return NextResponse.json({ ok: false, error: "elderlyID required" }, { status: 400 });
    }

    // ตรวจว่ามี elderlyID นี้อยู่จริง
    const [existRows] = await db.execute(
      `SELECT elderlyID FROM elderly WHERE elderlyID = ? LIMIT 1`,
      [String(elderlyID).trim()]
    );
    if (existRows.length === 0) {
      return NextResponse.json({ ok: false, error: `elderlyID not found: ${elderlyID}` }, { status: 404 });
    }

    // เซ็ตคำตอบ 5 ข้อให้เป็น 0/1
    let vals;
    if (Array.isArray(answers) && answers.length >= 5) {
      vals = answers.slice(0, 5).map(to01);
    } else {
      vals = [
        to01(stiffness),
        to01(crepitus),
        to01(bonyTenderness),
        to01(bonyEnlargement),
        to01(noWarmth),
      ];
    }
    const [s1, s2, s3, s4, s5] = vals;
    const yesCount = vals.reduce((a, b) => a + (b ? 1 : 0), 0);

    const resultText =
      yesCount >= 2
        ? "มีโอกาสที่จะเป็นโรคข้อเข่าเสื่อม"
        : "ไม่เป็นโรคข้อเข่าเสื่อมตามเกณฑ์นี้";

    // บันทึกลง healthassessment (ใช้ชื่อคอลัมน์ของคุณ)
    const [ret] = await db.execute(
      `
      INSERT INTO healthassessment
        (userID, elderlyID, assessmentDate,
         stiffness, crepitus, bonyTenderness, bonyEnlargement, noWarmth,
         yesCount, resultText)
      VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userID ?? null,
        String(elderlyID).trim(),
        s1, s2, s3, s4, s5,
        yesCount,
        resultText,
      ]
    );

    return NextResponse.json(
      { ok: true, assessmentID: ret.insertId, elderlyID: String(elderlyID).trim(), yesCount, resultText },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/assessment error:", err);
    const msg = String(err?.message || "Unknown error");
    const status = /constraint|duplicate|ER_/.test(msg) ? 400 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
