import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { useAuthStore } from "@/shared/store/auth-store";

// Routes that don't require authentication
const publicRoutes = ["/login", "/forgot-password", "/api/auth"];

// Routes that require specific roles
const roleProtectedRoutes: Record<string, string[]> = {
  "/admin": ["admin"],
  "/settings": ["admin", "production", "attendance", "finance"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes (except auth)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Check authentication using cookies
  const token = request.cookies.get("proart-token")?.value;
  const userJson = request.cookies.get("proart-user")?.value;

  if (!token || !userJson) {
    // Redirect to login for dashboard routes
    if (pathname.startsWith("/dashboard") || pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Parse user data
  try {
    const user = JSON.parse(userJson);

    // Check role-based access
    for (const [route, roles] of Object.entries(roleProtectedRoutes)) {
      if (pathname.startsWith(route) && !roles.includes(user.role)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  } catch {
    // Invalid user data, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("proart-token");
    response.cookies.delete("proart-user");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons).*)",
  ],
};
