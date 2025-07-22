import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST /admin/healthinfo
export async function POST(req) {
  try {
    const db = await connectDB();
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    await db.execute(
      'INSERT INTO health_info (title, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [title, content]
    );

    return NextResponse.json({ message: 'Health info created' });
  } catch (error) {
    console.error('API POST /admin/healthinfo error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// GET /admin/healthinfo
export async function GET() {
  try {
    const db = await connectDB();

    const [rows] = await db.execute('SELECT * FROM health_info ORDER BY created_at DESC');

    return NextResponse.json(rows);
  } catch (error) {
    console.error('API GET /admin/healthinfo error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
