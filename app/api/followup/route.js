import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'

/* ============================================================
   ✅ GET: ดึงข้อมูลสรุปและรายละเอียดการประเมินของผู้สูงอายุ
============================================================ */
export async function GET(req) {
  try {
    const db = await connectDB()
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'followup'

    /* ------------------------------------------------------------
       🟢 1. โหมด summary — แสดงสรุปแต่ละผู้สูงอายุ
    ------------------------------------------------------------ */
    if (mode === 'summary') {
      const [rows] = await db.execute(`
        SELECT 
          e.citizenID AS citiZenID,       -- ✅ ใช้เลขบัตรประชาชนแทน elderlyID
          e.name,
          COUNT(a.assessmentID) AS totalAssessments,
          MAX(DATE_FORMAT(a.assessmentDate, '%d/%m/%Y')) AS latestAssessmentDate,
          (
            SELECT CONCAT(u.firstName, ' ', u.lastName)
            FROM healthassessment a2
            LEFT JOIN user u ON a2.userID = u.userID
            WHERE a2.elderlyID = e.elderlyID
            ORDER BY a2.assessmentDate DESC
            LIMIT 1
          ) AS assessorName
        FROM elderly e
        LEFT JOIN healthassessment a ON e.elderlyID = a.elderlyID
        GROUP BY e.citizenID, e.name
        ORDER BY e.elderlyID;
      `)
      return NextResponse.json(rows)
    }

    /* ------------------------------------------------------------
       🟢 2. โหมด detail — ดูประวัติการประเมินของผู้สูงอายุแต่ละคน
       🔗 ตัวอย่างเรียก: /api/followup?mode=detail&citiZenID=1234567890123
    ------------------------------------------------------------ */
    if (mode === 'detail') {
      const citizenID = searchParams.get('citiZenID')
      if (!citizenID)
        return NextResponse.json({ error: 'กรุณาระบุเลขบัตรประชาชน' }, { status: 400 })

      const [rows] = await db.execute(`
        SELECT 
          a.assessmentID,
          e.citizenID AS citiZenID,
          e.name AS elderlyName,
          DATE_FORMAT(a.assessmentDate, '%d/%m/%Y') AS assessmentDate,
          CONCAT(u.firstName, ' ', u.lastName) AS assessorName,
          a.yesCount,
          a.resultText
        FROM healthassessment a
        LEFT JOIN elderly e ON a.elderlyID = e.elderlyID
        LEFT JOIN user u ON a.userID = u.userID
        WHERE e.citizenID = ?
        ORDER BY a.assessmentDate DESC;
      `, [citizenID])

      return NextResponse.json(rows)
    }

    /* ------------------------------------------------------------
       🟢 3. โหมด followup — ข้อมูลการติดตามทั่วไป
    ------------------------------------------------------------ */
    const [rows] = await db.execute(`
      SELECT f.*, e.name 
      FROM followup f
      LEFT JOIN elderly e ON e.elderlyID = f.elderlyID
      ORDER BY f.followupDate DESC
    `)
    return NextResponse.json(rows)

  } catch (err) {
    console.error('GET /api/followup error:', err)
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 })
  }
}

/* ============================================================
   ✅ POST: เพิ่มข้อมูลการติดตามใหม่
============================================================ */
export async function POST(req) {
  try {
    const db = await connectDB()
    const body = await req.json()
    const { elderlyID, followupDate, symptom, treatment, nextAppointment, note } = body

    await db.execute(
      `INSERT INTO followup (elderlyID, followupDate, symptom, treatment, nextAppointment, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [elderlyID, followupDate, symptom, treatment, nextAppointment, note]
    )

    return NextResponse.json({ ok: true, message: 'บันทึกข้อมูลติดตามสำเร็จ' })
  } catch (err) {
    console.error('POST /api/followup error:', err)
    return NextResponse.json({ error: 'ไม่สามารถเพิ่มข้อมูลได้' }, { status: 500 })
  }
}
