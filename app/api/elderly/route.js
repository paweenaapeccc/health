import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// GET /api/elderly?search=...&page=1&pageSize=20
export async function GET(req) {
  try {
    const db = await connectDB()
    const url = new URL(req.url)
    const search = (url.searchParams.get('search') || '').trim()
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(url.searchParams.get('pageSize') || '20', 10), 1), 100)
    const offset = (page - 1) * pageSize

    const where = []
    const params = []

    if (search) {
      const kw = `%${search}%`
      where.push(`(
        name LIKE ? OR phonNumber LIKE ? OR citizenID LIKE ? OR
        address LIKE ? OR subdistrict LIKE ? OR district LIKE ? OR province LIKE ?
      )`)
      params.push(kw, kw, kw, kw, kw, kw, kw)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM elderly ${whereSql}`,
      params
    )
    const total = countRows?.[0]?.total ?? 0

    // ✅ ใช้คอลัมน์ latlong และแตก lat/long เฉพาะตอน select (ถ้าต้องใช้)
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
        address,
        subdistrict, district, province,
        latlong,
        -- เฉพาะเวลาอยากแสดงแบบแยก (ไม่ใช่คอลัมน์จริงในตาราง)
        TRIM(SUBSTRING_INDEX(latlong, ',', 1))       AS latitude_text,
        TRIM(SUBSTRING_INDEX(latlong, ',', -1))      AS longitude_text
      FROM elderly
      ${whereSql}
      ORDER BY elderlyID ASC
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    )

    return NextResponse.json({
      ok: true,
      data: rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (error) {
    console.error('API GET /api/elderly error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST /api/elderly
export async function POST(req) {
  try {
    const db = await connectDB()
    const token = (await cookies()).get('token')?.value
    if (!token) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    let payload
    try { ({ payload } = await jwtVerify(token, secret)) }
    catch { return NextResponse.json({ error: 'เซสชันไม่ถูกต้อง' }, { status: 401 }) }

    const userId = payload?.userId ?? payload?.id ?? payload?.userID ?? null
    if (!userId) return NextResponse.json({ error: 'ไม่พบ userId ในเซสชัน' }, { status: 401 })

    const body = await req.json()
    const {
      name, birthDate, gender, address, subdistrict, district, province,
      citizenID = null, phone, phonNumber, phoneNumber,
      // ฟอร์มเก่าอาจยังส่ง latitude/longitude มาได้
      latitude = null, longitude = null,
      // ฟอร์มใหม่ส่ง latlong มาโดยตรง
      latlong: latlongFromBody = null,
    } = body || {}

    // validate field บังคับ
    const required = { name, birthDate, gender, address, subdistrict, district, province }
    for (const [k, v] of Object.entries(required)) {
      if (!String(v ?? '').trim()) {
        return NextResponse.json({ error: `กรุณากรอก ${k}` }, { status: 400 })
      }
    }

    // โทนสะกดคอลัมน์ใน DB คือ phonNumber
    const phoneValue = (phoneNumber ?? phone ?? phonNumber) ?? null

    // ✅ รวมพิกัดเป็นสตริงเดียวให้ตรงกับคอลัมน์ latlong
    const latlong =
      latlongFromBody && String(latlongFromBody).trim() !== ''
        ? String(latlongFromBody).trim()
        : (latitude ?? '') !== '' && (longitude ?? '') !== ''
          ? `${latitude},${longitude}`
          : null

    await db.execute(
      `
      INSERT INTO elderly
        (userID, name, phonNumber, citizenID, birthDate, gender,
         address, subdistrict, district, province, latlong)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [userId, name, phoneValue, citizenID, birthDate, gender,
       address, subdistrict, district, province, latlong]
    )

    return NextResponse.json({ message: 'Elderly created' }, { status: 201 })
  } catch (error) {
    console.error('API POST /api/elderly error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
