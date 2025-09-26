import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

// ---------- GET /api/elderly/[id] ----------
export async function GET(_req, { params }) {
  try {
    const elderlyID = params.id;          // ใช้เป็นสตริงตรง ๆ (เช่น ELD002)
    const db = await connectDB();
    const [rows] = await db.execute(
      `
      SELECT
        elderlyID  AS id,
        userID     AS userId,
        name,
        phonNumber AS phoneNumber,
        citizenID,
        birthDate,
        gender,
        address, subdistrict, district, province,
        latlong    AS latitude          -- ← ใช้คอลัมน์ latlong แล้ว map ชื่อส่งกลับเป็น latitude
      FROM elderly
      WHERE elderlyID = ?
      `,
      [elderlyID]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (e) {
    console.error('GET elderly error:', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}

// ---------- PUT /api/elderly/[id] ----------
export async function PUT(req, { params }) {
  try {
    const elderlyID = params.id;
    const body = await req.json();
    const db = await connectDB();

    // ไม่อัปเดต userID เพื่อหลีกเลี่ยงชน FK
    await db.execute(
      `
      UPDATE elderly SET
        name=?,
        phonNumber=?,
        citizenID=?,
        birthDate=?,
        gender=?,
        address=?,
        subdistrict=?,
        district=?,
        province=?,
        latlong=?                     -- ← อัปเดตลงคอลัมน์ latlong เพียงคอลัมน์เดียว
      WHERE elderlyID=?
      `,
      [
        body.name ?? null,
        body.phone ?? body.phoneNumber ?? null,
        body.citizenID ?? null,
        body.birthDate ?? null,
        body.gender ?? null,
        body.address ?? null,
        body.subdistrict ?? null,
        body.district ?? null,
        body.province ?? null,
        body.latitude ?? null,        // ← ฟอร์มยังส่งมาในชื่อ latitude (เช่น "14.999999,103.000000")
        elderlyID
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT elderly error:', e);
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 });
  }
}
