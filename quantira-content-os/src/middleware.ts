import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const hasSecureCookie = req.cookies.has("__Secure-next-auth.session-token")
  const secureCookie = hasSecureCookie || req.headers.get("x-forwarded-proto") === "https"
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || "some-super-secret-key-at-least-32-chars-long",
    secureCookie
  })
  const { pathname } = req.nextUrl

  // 1. Allow NextAuth authentication routes automatically
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const isPublicRoute = pathname === "/login" || pathname === "/unauthorized"

  // 2. Redirect unauthenticated users to /login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 3. Redirect authenticated users away from login page to dashboard
  if (token && pathname === "/login") {
    const userRole = token.role as string
    if (userRole === "CLIENT") {
      return NextResponse.redirect(new URL("/client-portal/dashboard", req.url))
    }
    return NextResponse.redirect(new URL("/", req.url))
  }

  // 4. Role-based route authorization redirects
  if (token) {
    const userRole = token.role as string
    const clientName = token.clientName as string

    // If active user is a CLIENT client
    if (userRole === "CLIENT") {
      if (pathname === "/") {
        return NextResponse.redirect(new URL("/client-portal/dashboard", req.url))
      }
      if (!pathname.startsWith("/client-portal") && !isPublicRoute) {
        return NextResponse.redirect(new URL("/client-portal/dashboard", req.url))
      }
      if (pathname.startsWith("/client-portal") && !clientName) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
      return NextResponse.next()
    }

    // If active user is internal team staff member
    if (userRole !== "CLIENT") {
      if (pathname.startsWith("/client-portal")) {
        return NextResponse.redirect(new URL("/", req.url))
      }

      const adminOrManagerOnly = ["/clients", "/campaigns", "/client-dashboard"]
      const reviewRoles = ["/approvals", "/performance", "/scorecard"]
      const productionRoles = ["/production"]

      // Check Admin & Account Manager restricted paths
      if (adminOrManagerOnly.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        if (userRole !== "ADMIN" && userRole !== "ACCOUNT_MANAGER") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }

      // Check Reviewer-level restricted paths
      if (reviewRoles.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        if (userRole !== "ADMIN" && userRole !== "ACCOUNT_MANAGER" && userRole !== "REVIEWER") {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }

      // Check Production-level restricted paths
      if (productionRoles.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        const allowed = ["ADMIN", "ACCOUNT_MANAGER", "COPYWRITER", "DESIGNER", "REVIEWER"]
        if (!allowed.includes(userRole)) {
          return NextResponse.redirect(new URL("/unauthorized", req.url))
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.css).*)",
  ],
}
