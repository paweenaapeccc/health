import { connectDB } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(req) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: 'username และ password ต้องระบุ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const db = await connectDB()

    // เช็คซ้ำ username
    const [existing] = await db.query('SELECT * FROM user WHERE username = ?', [username])
    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ message: 'username นี้ถูกใช้แล้ว' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10)

    // สมัครปกติ → role = 'user' ตลอด
    await db.query('INSERT INTO user (username, password, role) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      'user',
    ])

    return new Response(
      JSON.stringify({ message: 'สมัครสมาชิกสำเร็จ', role: 'user' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Register API error:', error)
    return new Response(
      JSON.stringify({ message: 'เกิดข้อผิดพลาดในระบบ' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
