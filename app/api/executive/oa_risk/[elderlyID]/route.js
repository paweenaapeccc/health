import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const riskLabel = (k)=> k===2?"เสี่ยงต่ำ":k===3?"เสี่ยงปานกลาง":k===4?"เสี่ยงสูง":"เข้าข่ายชัดเจน";
const riskAdvice = (k)=>{
  if (k===2) return "ปรับพฤติกรรม/คุมน้ำหนัก ออกกำลังเสริมกล้ามเนื้อรอบเข่า ติดตามซ้ำ";
  if (k===3) return "นัดประเมินซ้ำ ส่งต่อแพทย์/กายภาพ เริ่มโปรแกรมป้องกัน";
  if (k===4) return "ตรวจละเอียด (X-ray/PE) เริ่มกายภาพ/ยาเสริม";
  return "เข้าข่ายชัดเจน: ส่งต่อแพทย์เฉพาะทาง วางแผนรักษาเชิงรุก";
};
const age = (b)=>{ if(!b) return null; const d=new Date(b); if(isNaN(+d)) return null;
  const n=new Date(); let a=n.getFullYear()-d.getFullYear();
  const m=n.getMonth()-d.getMonth(); if(m<0||(m===0&&n.getDate()<d.getDate())) a--; return a; };

// ✅ ฟังก์ชันเล็ก ๆ เพื่ออ่าน param ได้ทั้งกรณีเป็น object หรือ promise
async function readParam(context, key) {
  const p = context?.params;
  if (!p) return undefined;
  return (typeof p.then === "function" ? (await p)[key] : p[key]);
}

export async function GET(req, context) {
  try {
    const db = await connectDB();

    // auth
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ ok:false, error: "unauthorized" }, { status: 401 });
    try { await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET)); }
    catch { return NextResponse.json({ ok:false, error: "invalid token" }, { status: 401 }); }

    // 👇 สำคัญ: await params ก่อนใช้งาน
    const elderlyID = await readParam(context, "elderlyID");

    const [pRows] = await db.execute(
      `SELECT elderlyID, name, gender, birthDate, address, subdistrict, district, province
       FROM elderly WHERE elderlyID = ? LIMIT 1`,
      [elderlyID]
    );
    if (!pRows.length) return NextResponse.json({ ok:false, error:"not found" }, { status:404 });
    const p = pRows[0];

    const [aRows] = await db.execute(
      `SELECT assessmentID, assessmentDate, yesCount, resultText
       FROM healthassessment
       WHERE elderlyID = ?
       ORDER BY assessmentDate DESC`,
      [elderlyID]
    );

    const timeline = aRows.map(r=>({
      assessmentID: r.assessmentID,
      date: r.assessmentDate,
      yesCount: r.yesCount,
      riskLabel: (r.yesCount>=2 && r.yesCount<=5) ? riskLabel(r.yesCount) : "นอกเกณฑ์",
      resultText: r.resultText || null
    }));

    const latest = timeline[0] || null;
    const profile = {
      elderlyID: p.elderlyID,
      name: p.name,
      gender: p.gender==="male"?"ชาย":p.gender==="female"?"หญิง":"ไม่ระบุ",
      age: age(p.birthDate),
      address: [p.address, p.subdistrict, p.district, p.province].filter(Boolean).join(" "),
    };

    return NextResponse.json({
      ok:true,
      profile,
      latest,
      advice: latest ? ((latest.yesCount>=2 && latest.yesCount<=5) ? riskAdvice(latest.yesCount) : "ยังไม่เข้าเกณฑ์ 2–5 ข้อ") : "ยังไม่มีข้อมูลประเมิน",
      timeline
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok:false, error: e?.message || "server error" }, { status:500 });
  }
}
