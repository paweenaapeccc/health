import { connectDB } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(req) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: 'Username and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const db = await connectDB()
    const [rows] = await db.query('SELECT * FROM user WHERE username = ?', [username])

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const user = rows[0]
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return new Response(
        JSON.stringify({ message: 'Invalid password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        message: 'Login successful',
        user: {
          userID: user.userID,
          username: user.username,
          role: user.role,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
