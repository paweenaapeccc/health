import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

// ---------- GET /api/elderly/[id] ----------
export async function GET(_req, context) {
  try {
    const { params } = await context;  // ✅ ต้อง await ก่อนใช้
    const elderlyID = params.id;       // เช่น ELD002

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
        latlong    AS latitude
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

// ---------- DELETE /api/elderly/[id] ----------
export async function DELETE(_req, context) {
  try {
    const { params } = await context;  // ✅ Next.js 15 ต้อง await
    const elderlyID = params.id;

    const db = await connectDB();

    // ตรวจสอบว่ามีข้อมูลหรือไม่ก่อนลบ
    const [rows] = await db.execute(
      'SELECT elderlyID FROM elderly WHERE elderlyID = ?',
      [elderlyID]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลที่ต้องการลบ' }, { status: 404 });
    }

    // ลบข้อมูล
    await db.execute('DELETE FROM elderly WHERE elderlyID = ?', [elderlyID]);

    return NextResponse.json({ ok: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (e) {
    console.error('DELETE elderly error:', e);
    return NextResponse.json({ error: 'ลบข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}

// ---------- PUT /api/elderly/[id] ----------
export async function PUT(req, context) {
  try {
    const { params } = await context;  // ✅ await เช่นเดียวกัน
    const elderlyID = params.id;

    const body = await req.json();
    const db = await connectDB();

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
        latlong=?
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
        body.latitude ?? null,
        elderlyID,
      ]
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT elderly error:', e);
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 });
  }
}
