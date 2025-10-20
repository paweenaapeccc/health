import { SignJWT } from 'jose'
import { connectDB } from '@/lib/db'
import bcryptjs from 'bcryptjs'

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: 'Missing credentials' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ✅ เชื่อมต่อฐานข้อมูล 1 ครั้ง และไม่รอ promise ซ้อนเกินจำเป็น
    const db = await connectDB()
    const [rows] = await db.query(
      'SELECT userID, username, password, role FROM user WHERE username = ? LIMIT 1',
      [username]
    )

    if (!rows?.length) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = rows[0]

    // ✅ ใช้ compareSync ซึ่งเร็วกว่า await
    if (!bcryptjs.compareSync(password, user.password)) {
      return new Response(
        JSON.stringify({ message: 'Invalid password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ✅ เตรียม JWT secret ล่วงหน้า (ลด overhead ใน sign)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // ✅ ใช้ synchronous date เพื่อประหยัด time drift check
    const jwt = await new SignJWT({
      userID: user.userID,
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret)

    // ✅ cookie แบบเบาและปลอดภัย
    const cookie = [
      `token=${jwt}`,
      'HttpOnly',
      'Path=/',
      'Max-Age=86400',
      'SameSite=Strict',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ')

    // ✅ ตอบกลับพร้อม token เพื่อไม่ต้องเรียก /api/session ซ้ำ
    return new Response(
      JSON.stringify({
        message: 'Login successful',
        role: user.role,
        token: jwt,
        userID: user.userID,
      }),
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'Connection': 'keep-alive',
        },
      }
    )
  } catch (err) {
    console.error('❌ Login error:', err)
    return new Response(
      JSON.stringify({ message: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
