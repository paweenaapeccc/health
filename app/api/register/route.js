import { connectDB } from '@/lib/db'
import bcrypt from 'bcrypt'

// ประกาศ secretMap แค่ครั้งเดียว โดยใช้ environment variables
const secretMap = {
  admin: process.env.ADMIN_SECRET,
  executive: process.env.EXECUTIVE_SECRET,
}

export async function POST(req) {
  try {
    const { username, password, role, secret } = await req.json()

    if (!username || !password || !role) {
      return new Response(
        JSON.stringify({ message: 'username, password และ role ต้องระบุ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ถ้า role เป็น admin หรือ executive ต้องมี secret และต้องถูกต้อง
    if ((role === 'admin' || role === 'executive') && secret !== secretMap[role]) {
      return new Response(
        JSON.stringify({ message: 'รหัสลับไม่ถูกต้องสำหรับบทบาทนี้' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
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

    // insert ลง DB
    await db.query('INSERT INTO user (username, password, role) VALUES (?, ?, ?)', [
      username,
      hashedPassword,
      role,
    ])

    return new Response(
      JSON.stringify({ message: 'สมัครสมาชิกสำเร็จ' }),
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
