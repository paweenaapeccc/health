import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return Response.json({ isLoggedIn: false })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // ✅ ดึง userId จาก payload.userId หรือ sub
    const userId = Number(payload.userId ?? payload.sub)

    return Response.json({
      isLoggedIn: true,
      userId: Number.isFinite(userId) ? userId : null,
      username: payload.username,
      role: payload.role,
      // ออปชัน: เผื่ออยากใช้งานต่อ
      iat: payload.iat ?? null,
      exp: payload.exp ?? null,
    })
  } catch (err) {
    console.error('JWT invalid:', err)
    return Response.json({ isLoggedIn: false })
  }
}
