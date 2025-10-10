import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

// ---------- GET /api/elderly/[id] ----------
export async function GET(_req, { params }) {
  try {
    const elderlyID = params.id;
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
      WHERE elderlyID = ? AND deleted_at IS NULL -- <-- ⭐️ เพิ่มเงื่อนไขนี้
      `,
      [elderlyID]
    );

    // ถ้าไม่เจอข้อมูล (เพราะไม่มี ID นี้ หรือเพราะถูกลบไปแล้ว) ให้ส่ง 404
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

    const [result] = await db.execute(
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
      WHERE elderlyID = ? AND deleted_at IS NULL -- <-- ⭐️ เพิ่มเงื่อนไขนี้
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
        elderlyID
      ]
    );

    // ถ้าไม่มีแถวไหนถูกอัปเดต (เพราะไม่มี ID นี้ หรือเพราะถูกลบไปแล้ว) ให้ส่ง 404
    if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'ไม่พบข้อมูลที่จะอัปเดต' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PUT elderly error:', e);
    return NextResponse.json({ error: 'อัปเดตไม่สำเร็จ' }, { status: 500 });
  }
}

// ---------- DELETE /api/elderly/[id] ----------
export async function DELETE(_req, { params }) {
  try {
    const elderlyID = params.id;
    const db = await connectDB();

    // ใช้ UPDATE เพื่อทำ Soft Delete
    await db.execute(
      `UPDATE elderly SET deleted_at = NOW() WHERE elderlyID = ?`,
      [elderlyID]
    );

    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('SOFT DELETE elderly error:', e);
    return NextResponse.json({ error: 'ลบข้อมูลไม่สำเร็จ' }, { status: 500 });
  }
}