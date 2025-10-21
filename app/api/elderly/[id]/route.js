import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'

/* ==========================================================
   ✅ GET /api/elderly/[id]
   ดึงข้อมูลผู้สูงอายุรายบุคคล (เพศชาย/หญิง + วันเกิด พ.ศ.ไทย)
========================================================== */
export async function GET(req, context) {
  try {
    const { id: elderlyID } = await context.params
    const db = await connectDB()

    if (!elderlyID) {
      return NextResponse.json({ error: 'missing elderlyID' }, { status: 400 })
    }

    const [rows] = await db.execute(
      `
      SELECT 
        elderlyID AS id,
        name,
        citizenID,
        phonNumber AS phone,
        gender,
        birthDate,
        TIMESTAMPDIFF(YEAR, birthDate, CURDATE()) AS age,
        address,
        subdistrict,
        district,
        province,
        latlong,
        NULLIF(TRIM(SUBSTRING_INDEX(latlong, ',', 1)), '') AS latitude,
        NULLIF(TRIM(SUBSTRING_INDEX(latlong, ',', -1)), '') AS longitude,
        height,
        weight,
        congenitalDisease AS disease,
        note,
        exerciseFrequency,
        foodHabit,
        smoking,
        alcohol
      FROM elderly
      WHERE elderlyID = ?
      LIMIT 1
      `,
      [elderlyID]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้สูงอายุ' },
        { status: 404 }
      )
    }

    const r = rows[0]

    // ✅ แปลงเพศ: แสดงเฉพาะ "ชาย" / "หญิง"
    let genderTh = '-'
    if (r.gender?.toLowerCase() === 'male') genderTh = 'ชาย'
    if (r.gender?.toLowerCase() === 'female') genderTh = 'หญิง'

    // ✅ แปลงวันเกิดเป็นวันที่ไทย
    let birthTh = '-'
    if (r.birthDate) {
      const date = new Date(r.birthDate)
      const thYear = date.getFullYear() + 543
      const months = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ]
      birthTh = `${date.getDate()} ${months[date.getMonth()]} ${thYear}`
    }

    const data = {
      ...r,
      genderTh,
      birthTh,
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('GET /api/elderly/[id] error:', err)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

/* ==========================================================
   ✅ PUT /api/elderly/[id]
   แก้ไขข้อมูลผู้สูงอายุรายคน (เพิ่มรองรับข้อมูลสุขภาพ)
========================================================== */
export async function PUT(req, { params }) {
  try {
    const db = await connectDB()
    const elderlyID = params.id

    if (!elderlyID) {
      return NextResponse.json({ error: 'missing elderlyID' }, { status: 400 })
    }

    const body = await req.json()
    const {
      name,
      phoneNumber,
      citizenID,
      birthDate,
      gender,
      address,
      subdistrict,
      district,
      province,
      latitude,
      longitude,
      latlong,
      height,
      weight,
      disease, // ✅ รับจาก frontend
      note,
      exerciseFrequency,
      foodHabit,
      smoking,
      alcohol
    } = body

    // ✅ แปลง disease → congenitalDisease ให้ตรงคอลัมน์ในฐานข้อมูล
    const congenitalDisease = disease ?? null

    // ✅ รวมค่าพิกัด
    let latlongValue = null
    if (latlong && String(latlong).trim() !== '') {
      latlongValue = String(latlong).trim()
    } else if (latitude && longitude) {
      latlongValue = `${latitude},${longitude}`
    }

    const [result] = await db.execute(
      `
      UPDATE elderly
      SET
        name = ?,
        phonNumber = ?,
        citizenID = ?,
        birthDate = ?,
        gender = ?,
        address = ?,
        subdistrict = ?,
        district = ?,
        province = ?,
        latlong = ?,
        height = ?,                -- ✅ ส่วนสูง
        weight = ?,                -- ✅ น้ำหนัก
        congenitalDisease = ?,     -- ✅ โรคประจำตัว
        note = ?,               -- ✅ หมายเหตุ
        exerciseFrequency = ?,     -- ✅ ความถี่การออกกำลังกาย
        foodHabit = ?,            -- ✅ นิสัยการรับประทานอาหาร
        smoking = ?,              -- ✅ การสูบบุหรี่
        alcohol = ?               -- ✅ การดื่มแอลกอฮอล์
      WHERE elderlyID = ?
      `,
      [
        name ?? null,
        phoneNumber ?? null,
        citizenID ?? null,
        birthDate ?? null,
        gender ?? null,
        address ?? null,
        subdistrict ?? null,
        district ?? null,
        province ?? null,
        latlongValue ?? null,
        height ?? null,
        weight ?? null,
        congenitalDisease ?? null,
        note ?? null,
        exerciseFrequency ?? null,
        foodHabit ?? null,
        smoking ?? null,
        alcohol ?? null,
        elderlyID,
      ]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้สูงอายุที่ต้องการแก้ไข' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, message: 'อัปเดตข้อมูลสำเร็จ' }, { status: 200 })
  } catch (err) {
    console.error('PUT /api/elderly/[id] error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดขณะอัปเดตข้อมูล' }, { status: 500 })
  }
}

/* ==========================================================
   ✅ DELETE /api/elderly/[id]
   ลบข้อมูลผู้สูงอายุรายคน
========================================================== */
export async function DELETE(req, { params }) {
  try {
    const db = await connectDB()
    const elderlyID = params.id

    if (!elderlyID) {
      return NextResponse.json({ error: 'missing elderlyID' }, { status: 400 })
    }

    // ✅ ตรวจว่ามีข้อมูลนี้อยู่ก่อน
    const [check] = await db.execute(
      'SELECT elderlyID FROM elderly WHERE elderlyID = ? LIMIT 1',
      [elderlyID]
    )
    if (check.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้สูงอายุที่ต้องการลบ' }, { status: 404 })
    }

    // ✅ ลบข้อมูลลูกที่อ้างถึง elderlyID ก่อน (เพื่อป้องกัน Foreign Key Error)
    await db.execute('DELETE FROM assessmentresults WHERE elderlyID = ?', [elderlyID])
    await db.execute('DELETE FROM healthassessment WHERE elderlyID = ?', [elderlyID])

    // ✅ จากนั้นลบ elderly ได้เลย
    const [result] = await db.execute('DELETE FROM elderly WHERE elderlyID = ?', [elderlyID])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'ไม่สามารถลบข้อมูลได้' }, { status: 500 })
    }

    // ✅ ตอบกลับ JSON เสมอ
    return NextResponse.json({ ok: true, message: 'ลบข้อมูลสำเร็จ' }, { status: 200 })
  } catch (err) {
    console.error('DELETE /api/elderly/[id] error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' }, { status: 500 })
  }
}
