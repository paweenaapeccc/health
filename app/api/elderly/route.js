import { connectDB } from '@/lib/db'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

/* ==========================================================
   ✅ GET /api/elderly
   ดึงรายชื่อผู้สูงอายุทั้งหมด (ใช้ในหน้ารายการ)
========================================================== */
export async function GET(req) {
  try {
    const db = await connectDB()
    const url = new URL(req.url)
    const search = (url.searchParams.get('search') || '').trim()

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

    const [rows] = await db.execute(
      `
      SELECT
        elderlyID AS id,
        userID AS userId,
        name,
        phonNumber,
        citizenID,
        birthDate,
        gender,
        address,
        subdistrict,
        district,
        province,
        latlong,
        height,
        weight,
        congenitalDisease,
        note
      FROM elderly
      ${whereSql}
      ORDER BY elderlyID DESC
      `,
      params
    )

    // ✅ เพิ่มฟังก์ชันคำนวณอายุ
    const calcAge = (birthDate) => {
      if (!birthDate) return '-'
      const birth = new Date(birthDate)
      if (isNaN(birth)) return '-'
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      return age
    }

    // ✅ เพิ่มฟิลด์ age ให้แต่ละรายการ
    const data = rows.map((r) => ({
      ...r,
      age: calcAge(r.birthDate),
    }))

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('GET /api/elderly error:', err)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลได้' }, { status: 500 })
  }
}

/* ==========================================================
   ✅ POST /api/elderly
   เพิ่มข้อมูลผู้สูงอายุใหม่ (รองรับช่องพิกัดเดียว)
========================================================== */
export async function POST(req) {
  try {
    const db = await connectDB()

    // ✅ ตรวจ token (กรณีมีระบบ login)
    const token = (await cookies()).get('token')?.value
    let userId = null
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)
        userId = payload?.userId ?? payload?.id ?? payload?.userID ?? null
      } catch (e) {
        console.warn('JWT verify fail:', e)
      }
    }

    // ✅ รับค่าจาก body
    const body = await req.json()
    const {
      name, phoneNumber, citizenID,
      birthDate, gender, address,
      subdistrict, district, province,
      latitude, longitude, latlong,
      height, weight, congenitalDisease, note
    } = body

    // ✅ ตรวจสอบข้อมูลจำเป็น
    const required = { name, birthDate, gender, address, subdistrict, district, province }
    for (const [k, v] of Object.entries(required)) {
      if (!String(v ?? '').trim()) {
        return NextResponse.json({ error: `กรุณากรอก ${k}` }, { status: 400 })
      }
    }

    // ✅ รวมค่า latlong
    let latlongValue = null
    if (latlong && String(latlong).trim() !== '') {
      latlongValue = String(latlong).trim()
    } else if (latitude && String(latitude).includes(',')) {
      latlongValue = String(latitude).trim()
    } else if (latitude && longitude) {
      latlongValue = `${latitude},${longitude}`
    }

    // ✅ INSERT ลงฐานข้อมูล
    await db.execute(
      `
      INSERT INTO elderly (
        userID, name, phonNumber, citizenID, birthDate, gender,
        address, subdistrict, district, province, latlong,
        height, weight, congenitalDisease, note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
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
        note ?? null
      ]
    )

    return NextResponse.json({ message: 'เพิ่มข้อมูลผู้สูงอายุสำเร็จ' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/elderly error:', err)
    return NextResponse.json({ error: 'เพิ่มข้อมูลไม่สำเร็จ' }, { status: 500 })
  }
}
