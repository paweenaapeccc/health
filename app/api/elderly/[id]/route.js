import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'

/* ==========================================================
   ✅ PUT /api/elderly/[id]
   แก้ไขข้อมูลผู้สูงอายุรายคน
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
      congenitalDisease,
      note,
    } = body

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
        height = ?,
        weight = ?,
        congenitalDisease = ?,
        note = ?
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
    const [result] = await db.execute(
      'DELETE FROM elderly WHERE elderlyID = ?',
      [elderlyID]
    )

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบข้อมูลได้' },
        { status: 500 }
      )
    }

    // ✅ ตอบกลับ JSON เสมอ
    return NextResponse.json({ ok: true, message: 'ลบข้อมูลสำเร็จ' }, { status: 200 })
  } catch (err) {
    console.error('DELETE /api/elderly/[id] error:', err)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' }, { status: 500 })
  }
}
