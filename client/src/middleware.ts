import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/feed", "/setup", "/settings", "/post", "/messages"];
const AUTH_ONLY = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = !!request.cookies.get("lot_r1");

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/setup/:path*",
    "/settings/:path*",
    "/post/:path*",
    "/messages/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
