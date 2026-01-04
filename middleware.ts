import { auth } from '@/lib/auth/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  
  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}