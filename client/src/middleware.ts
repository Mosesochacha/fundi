import { NextResponse } from "next/server";
import type { AppRole } from "@/features/auth/types/auth.types";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";

/** Logged-in users bounce away from these. */
const AUTH_ONLY = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

/**
 * Role dashboards — gated by exact role. `/worker` can't be blanket-gated
 * (`/worker/[id]` is a public profile), so only its dashboard is listed.
 */
const ROLE_GATED: Record<string, AppRole> = {
  "/worker/dashboard": "worker",
  "/worker/messages": "worker",
  "/employer": "employer",
  "/admin": "admin",
  "/moderator": "moderator",
};

/** Any authenticated user. (`/worker/[id]` stays public — it's a profile view.) */
const AUTH_REQUIRED = [
  "/setup",
  "/worker/profile",
];

const matches = (path: string, prefix: string) =>
  path === prefix || path.startsWith(prefix + "/");

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;

  const toLogin = () => {
    const url = nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  };
  const toDashboard = () => {
    const url = nextUrl.clone();
    url.pathname = dashboardPathForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  };

  // Already signed in → keep them out of the auth screens.
  if (AUTH_ONLY.some((p) => matches(path, p))) {
    return session ? toDashboard() : NextResponse.next();
  }

  // Role-gated dashboard areas.
  for (const [prefix, needed] of Object.entries(ROLE_GATED)) {
    if (matches(path, prefix)) {
      if (!session) return toLogin();
      if (role !== needed) return toDashboard();
      return NextResponse.next();
    }
  }

  // Authenticated-only areas.
  if (AUTH_REQUIRED.some((p) => matches(path, p))) {
    if (!session) return toLogin();
    if (matches(path, "/worker/profile") && role !== "worker") {
      return toDashboard();
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/setup/:path*",
    "/worker/profile/:path*",
    "/worker/dashboard/:path*",
    "/worker/messages/:path*",
    "/employer/:path*",
    "/admin/:path*",
    "/moderator/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
