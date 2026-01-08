import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth(async (req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth")
  const isOnHome = req.nextUrl.pathname === "/"
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin")
  const isOnPublicShare = req.nextUrl.pathname.startsWith("/share/reviews/")

  // Public share routes - allow unauthenticated access
  if (isOnPublicShare) {
    return NextResponse.next()
  }

  // Admin route protection
  if (isOnAdmin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Check if user is admin (we'll check in the route handlers for now)
    // Since we can't easily access Prisma in middleware, we'll handle this in the route
    // This middleware ensures at least authentication
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  if (isLoggedIn && isOnHome) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isLoggedIn && isOnAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
