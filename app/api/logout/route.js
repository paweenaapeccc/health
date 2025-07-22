import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies() // ✅ ต้อง await

  cookieStore.set('token', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })

  return new Response(null, { status: 200 })
}
