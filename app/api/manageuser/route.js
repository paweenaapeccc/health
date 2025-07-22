import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = await connectDB();
    const [rows] = await db.execute('SELECT * FROM user');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('API GET /manageuser error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const db = await connectDB();
    const { username, role } = await req.json();

    if (!username || !role) {
      return NextResponse.json({ error: 'Missing username or role' }, { status: 400 });
    }

    await db.execute('INSERT INTO user (username, role) VALUES (?, ?)', [username, role]);

    return NextResponse.json({ message: 'User added' });
  } catch (error) {
    console.error('API POST /manageuser error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
