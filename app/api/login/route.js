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
    const [rows] = await db.query('SELECT * FROM user WHERE username = ?', [username])
    const user = rows[0]
    if (!user) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return new Response(JSON.stringify({ message: 'Invalid password' }), { status: 401 })

    // ✅ สร้าง JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const jwt = await new SignJWT({
      userID: user.userID,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1d')
      .sign(secret)

    // ✅ เซ็ต cookie
    const cookie = `token=${jwt}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict; ${
      process.env.NODE_ENV === 'production' ? 'Secure;' : ''
    }`

    return new Response(
      JSON.stringify({ message: 'Login successful', role: user.role }),
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ message: 'Internal error' }), { status: 500 })
  }
}
