import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_secret_only_for_local_testing_do_not_use_in_prod"
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session_token")?.value;
  let payload: any = null;

  if (token) {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (e) {
      payload = null;
    }
  }

  // 0. Prevent already logged-in users from getting stuck re-authenticating on login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    const errorParam = req.nextUrl.searchParams.get("error");
    
    // If the server explicitly redirected here due to an expired/invalid session, clear the cookie now
    if (errorParam === "session_expired" && token) {
      const response = NextResponse.next();
      response.cookies.delete("session_token");
      return response;
    }

    if (payload) {
      if (payload.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
      if (payload.role === "MENTOR") return NextResponse.redirect(new URL("/mentor-dashboard", req.url));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 1. Admin Routes & API Protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!payload || payload.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
    }
  }

  // 2. Protected App Sections (Requires Authenticated User)
  const protectedPaths = [
    "/dashboard",
    "/mentor-dashboard",
    "/mentor",
    "/chats",
    "/community",
    "/profile",
    "/wallet",
    "/scheduled-calls",
    "/mentors",
    "/my-mentors",
    "/book-call",
    "/notifications",
    "/onboarding",
    "/meetings",
    "/group-meetings",
  ];
  if (protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 4. CSRF Protection for state-changing browser requests to APIs (POST, PUT, DELETE, PATCH)
  // Exclude webhooks, scheduled sync, and internal service calls
  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(req.method) &&
    !pathname.startsWith("/api/webhooks/") &&
    !req.headers.has("x-internal-secret")
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host && !origin.includes(host) && origin !== process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json({ error: "Cross-Site Request Forgery (CSRF) check failed" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login", "/signup",
    "/admin", "/admin/:path*",
    "/api/admin", "/api/admin/:path*",
    "/mentor-dashboard", "/mentor-dashboard/:path*",
    "/mentor", "/mentor/:path*",
    "/dashboard", "/dashboard/:path*",
    "/chats", "/chats/:path*",
    "/community", "/community/:path*",
    "/profile", "/profile/:path*",
    "/wallet", "/wallet/:path*",
    "/scheduled-calls", "/scheduled-calls/:path*",
    "/mentors", "/mentors/:path*",
    "/my-mentors", "/my-mentors/:path*",
    "/book-call", "/book-call/:path*",
    "/notifications", "/notifications/:path*",
    "/onboarding", "/onboarding/:path*",
    "/meetings", "/meetings/:path*",
    "/group-meetings", "/group-meetings/:path*",
    "/api", "/api/:path*",
  ],
};
