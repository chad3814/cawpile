import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth")
  const isOnHome = req.nextUrl.pathname === "/"

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