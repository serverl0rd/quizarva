import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/auth'

// Create a wrapper function that handles public routes before auth
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Define public routes
  const publicRoutes = ['/', '/login', '/terms', '/privacy']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  // Allow public routes without auth check
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // For all other routes, use the auth middleware
  return (auth as any)(async (req: any) => {
    const isAuth = !!req.auth
    
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    return NextResponse.next()
  })(request, NextResponse.next())
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}