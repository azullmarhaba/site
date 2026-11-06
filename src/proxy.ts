import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

/**
 * Cheap pre-filter: redirect cookieless requests away from private areas.
 * Authoritative session + role verification happens server-side in the
 * /account and /admin layouts (Node runtime) via `auth()` and `requireRole`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPrivate =
    pathname.startsWith("/account") ||
    pathname.startsWith("/admin");

  if (!isPrivate) return NextResponse.next();

  const hasSession =
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has(SECURE_SESSION_COOKIE);

  if (!hasSession) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
