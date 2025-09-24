import { SignJWT } from 'jose'
import { connectDB } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return new Response(JSON.stringify({ message: 'Missing credentials' }), { status: 400 })
    }

    const db = await connectDB()

    // ใช้ชื่อคอลัมน์ตรงกับตาราง: userID, username, password, role
    const [rows] = await db.query('SELECT userID, username, password, role FROM user WHERE username = ?', [username])
    const user = rows && rows[0]
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      return new Response(JSON.stringify({ message: 'Invalid password' }), { status: 401 })
    }

    const role = user.role || 'user'

    // สร้าง JWT (ใส่ iat + อายุ 1 วัน)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'devsecret')
    const token = await new SignJWT({
      userID: user.userID,       // ตรงกับตารางของคุณ (เช่น USR001)
      username: user.username,
      role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret)

    // ตั้งคุกกี้แบบปลอดภัย
    const cookie = [
      `token=${token}`,
      'HttpOnly',
      'Path=/',
      'Max-Age=86400',        // 1 วัน
      'SameSite=Lax',         // ปลอดภัยและใช้งานได้กับ redirect ภายในไซต์
      ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    ].join('; ')

    return new Response(JSON.stringify({ message: 'Login successful', role }), {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Internal error' }), { status: 500 })
  }
}
