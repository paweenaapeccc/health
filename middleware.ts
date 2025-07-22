import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const pathname = req.nextUrl.pathname

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const role = payload.role as string

    // ✅ ถ้าเป็น admin → เข้าได้ทุกหน้า
    if (role === 'admin') {
      return NextResponse.next()
    }

    // ✅ เงื่อนไขเฉพาะ role อื่น
    if (pathname.startsWith('/member') && role !== 'user') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    if (pathname.startsWith('/executive') && role !== 'executive') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // ✅ อนุญาต
    return NextResponse.next()
  } catch (err) {
    console.error('JWT verify failed:', err)
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/member/:path*',
    '/executive/:path*',
  ],
}
