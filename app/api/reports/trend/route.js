// app/api/reports/trend/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { connectDB } from '@/lib/db';

export async function GET(req) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ error: 'เซสชันไม่ถูกต้อง' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startYear = searchParams.get('startYear'); // ตัวเลือก
    const endYear = searchParams.get('endYear');

    const db = await connectDB();
    const where = [];
    const params = [];

    where.push('(ha.yesCount >= 3 OR ha.resultText LIKE ?)');
    params.push('%เข่าเสื่อม%');

    if (startYear) {
      where.push('YEAR(ha.assessmentDate) >= ?');
      params.push(Number(startYear));
    }
    if (endYear) {
      where.push('YEAR(ha.assessmentDate) <= ?');
      params.push(Number(endYear));
    }

    const [rows] = await db.query(
      `
      SELECT YEAR(ha.assessmentDate) AS y, COUNT(*) AS cnt
      FROM healthassessment ha
      WHERE ${where.join(' AND ')}
      GROUP BY YEAR(ha.assessmentDate)
      ORDER BY y
      `,
      params
    );

    return NextResponse.json({ series: rows, filter: { startYear, endYear } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
