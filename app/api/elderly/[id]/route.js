import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'

// helper: ดึง id จาก params (Next15: params เป็น Promise)
async function getId(context) {
  const { id } = await context.params
  const elderlyID = Number(id)
  if (!Number.isFinite(elderlyID)) {
    throw new Error('invalid id')
  }
  return elderlyID
}

// GET /api/elderly/:id
export async function GET(_req, context) {
  try {
    const elderlyID = await getId(context)

    const db = await connectDB()
    const [rows] = await db.execute(
      `
      SELECT
        elderlyID  AS id,
        userID     AS userId,
        name,
        phonNumber,
        citizenID,
        birthDate,
        TIMESTAMPDIFF(YEAR, birthDate, CURDATE()) AS ageYears,
        gender,
        address, subdistrict, district, province,
        latitude, longitude
      FROM elderly
      WHERE elderlyID = ?
      `,
      [elderlyID]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: rows[0] })
  } catch (error) {
    if (error.message === 'invalid id') {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }
    console.error('API GET /api/elderly/:id error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT /api/elderly/:id
export async function PUT(req, context) {
  try {
    const elderlyID = await getId(context)
    const body = await req.json()
    const phoneValue = (body.phone ?? body.phonNumber) ?? null

    const db = await connectDB()
    await db.execute(
      `
      UPDATE elderly SET
        userID = ?,
        name = ?,
        phonNumber = ?,
        citizenID = ?,
        birthDate = ?,
        gender = ?,
        address = ?,
        subdistrict = ?,
        district = ?,
        province = ?,
        latitude = ?,
        longitude = ?
      WHERE elderlyID = ?
      `,
      [
        body.userId ?? null,
        body.name ?? null,
        phoneValue,
        body.citizenID ?? null,
        body.birthDate ?? null,
        body.gender ?? null,
        body.address ?? null,
        body.subdistrict ?? null,
        body.district ?? null,
        body.province ?? null,
        body.latitude ?? null,
        body.longitude ?? null,
        elderlyID,
      ]
    )

    return NextResponse.json({ ok: true, message: 'Elderly updated' })
  } catch (error) {
    if (error.message === 'invalid id') {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }
    console.error('API PUT /api/elderly/:id error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE /api/elderly/:id
export async function DELETE(_req, context) {
  try {
    const elderlyID = await getId(context)

    const db = await connectDB()
    await db.execute(`DELETE FROM elderly WHERE elderlyID = ?`, [elderlyID])

    return NextResponse.json({ ok: true, message: 'Elderly deleted' })
  } catch (error) {
    if (error.message === 'invalid id') {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }
    console.error('API DELETE /api/elderly/:id error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
