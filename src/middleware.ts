import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check Supabase Auth cookie
  // The cookie is named sb-{project-ref}-auth-token
  const authCookies = request.cookies.getAll().filter(cookie =>
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  );

  const hasAuth = authCookies.length > 0;

  // Redirect to login if not authenticated and trying to access protected routes
  if (!hasAuth) {
    if (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/budgets") ||
        pathname.startsWith("/clients") ||
        pathname.startsWith("/production") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/notifications") ||
        pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (hasAuth && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};