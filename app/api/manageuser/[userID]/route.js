import { connectDB } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const db = await connectDB();
    const { id } = params;
    const { username, role } = await req.json();

    if (!username || !role) {
      return NextResponse.json({ error: 'Missing username or role' }, { status: 400 });
    }

    await db.execute('UPDATE user SET username = ?, role = ? WHERE id = ?', [username, role, id]);

    return NextResponse.json({ message: 'User updated' });
  } catch (error) {
    console.error('API PUT /manageuser/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const db = await connectDB();
    const { id } = params;

    await db.execute('DELETE FROM user WHERE id = ?', [id]);

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('API DELETE /manageuser/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
