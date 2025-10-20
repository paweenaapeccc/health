import { connectDB } from '@/lib/db'
import bcrypt from 'bcrypt'

// ประกาศ secretMap แค่ครั้งเดียว โดยใช้ environment variables
const secretMap = {
  admin: process.env.ADMIN_SECRET,
  executive: process.env.EXECUTIVE_SECRET,
}

export async function POST(req) {
  try {
    const {
      username,
      password,
      role,
      secret,
      firstName,
      lastName,
      email,
      phone,
    } = await req.json()

    if (!username || !password || !role) {
      return new Response(
        JSON.stringify({ message: 'username, password และ role ต้องระบุ' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ✅ ตรวจสอบรหัสลับเฉพาะบทบาท admin / executive เท่านั้น
    if ((role === 'admin' || role === 'executive') && secret !== secretMap[role]) {
      return new Response(
        JSON.stringify({ message: 'รหัสลับไม่ถูกต้องสำหรับบทบาทนี้' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const db = await connectDB()

    // ✅ เช็คซ้ำ username
    const [existing] = await db.query('SELECT * FROM user WHERE username = ?', [username])
    if (existing.length > 0) {
      return new Response(
        JSON.stringify({ message: 'username นี้ถูกใช้แล้ว' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ✅ เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ เพิ่มข้อมูลลง DB พร้อมฟิลด์ใหม่ (ไม่แตะ logic เดิม)
    await db.query(
      `INSERT INTO user (userID, firstName, lastName, email, phone, username, password, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateUserID(),
        firstName || '',
        lastName || '',
        email || '',
        phone || '',
        username,
        hashedPassword,
        role,
      ]
    )

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

/* ✅ ฟังก์ชันสร้าง userID อัตโนมัติ เช่น U00001 */
function generateUserID() {
  const n = Math.floor(100000 + Math.random() * 900000).toString().slice(1)
  return 'U' + n
}
