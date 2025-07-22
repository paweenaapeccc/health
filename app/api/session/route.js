import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET() {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('token')
  const token = tokenCookie?.value

  if (!token) {
    return Response.json({ isLoggedIn: false })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return Response.json({
      isLoggedIn: true,
      username: payload.username,
      role: payload.role
    })
  } catch (err) {
    console.error('JWT invalid:', err)
    return Response.json({ isLoggedIn: false })
  }
}
