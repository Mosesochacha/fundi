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
 * Role areas blanket-gated by exact role. `/worker` can't go here - its
 * `/worker/[id]` profile pages are viewable by any signed-in role (employers
 * view workers), so worker routes use WORKER_PROTECTED below.
 */
const ROLE_GATED: Record<string, AppRole> = {
  "/employer": "employer",
  "/admin": "admin",
  "/moderator": "moderator",
};

/**
 * Worker app routes that require `role === 'worker'`. Anything else under
 * `/worker/` (e.g. `/worker/123`) is a profile view — login-gated, but open to
 * any signed-in role. ADD new worker-only pages here, otherwise they ship
 * accessible to employers too.
 */
const WORKER_PROTECTED = [
  "dashboard",
  "messages",
  "profile",
  "requests",
  "reviews",
  "settings",
];

const matches = (path: string, prefix: string) =>
  path === prefix || path.startsWith(`${prefix}/`);

/** True for protected worker routes; false for `/worker/[id]` public profiles. */
const isProtectedWorkerPath = (path: string) => {
  if (!matches(path, "/worker")) return false;
  const seg = path.split("/")[2];
  return !!seg && WORKER_PROTECTED.includes(seg);
};

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;
  const complete = !!session?.backendUser?.isProfileComplete;

  // NextAuth's auth() wrapper rewrites req.nextUrl's origin to the AUTH_URL /
  // NEXTAUTH_URL env var, so redirects built from nextUrl.clone() send users
  // to whatever domain that env holds — not the site they're on. Rebuild the
  // origin from the forwarded host headers so redirects always stay on the
  // requesting domain.
  const redirect = (mutate: (url: URL) => void) => {
    const url = nextUrl.clone();
    mutate(url);
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) {
      // url.host carries the port when the header has one (localhost:3000)
      url.host = host;
      url.protocol =
        req.headers.get("x-forwarded-proto") ??
        (host.startsWith("localhost") ? "http" : "https");
    }
    return NextResponse.redirect(url);
  };

  const toLogin = () =>
    redirect((url) => {
      url.pathname = "/login";
      url.search = "";
      url.searchParams.set("next", path);
    });
  const toDashboard = () =>
    redirect((url) => {
      url.pathname = dashboardPathForRole(role);
      url.search = "";
    });
  const toOnboarding = () =>
    redirect((url) => {
      url.pathname = "/onboarding";
      url.search = "";
    });

  if (matches(path, "/onboarding")) {
    if (!session) return toLogin();
    if (complete) return toDashboard();
    return NextResponse.next();
  }

  if (AUTH_ONLY.some((p) => matches(path, p))) {
    if (!session) return NextResponse.next();
    return complete ? toDashboard() : toOnboarding();
  }

  if (matches(path, "/worker")) {
    if (!isProtectedWorkerPath(path)) return NextResponse.next();
    if (!session) return toLogin();
    if (!complete) return toOnboarding();
    if (role !== "worker") return toDashboard();
    return NextResponse.next();
  }

  for (const [prefix, needed] of Object.entries(ROLE_GATED)) {
    if (matches(path, prefix)) {
      if (!session) return toLogin();
      if (!complete) return toOnboarding();
      if (role !== needed) return toDashboard();
      return NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images|.*\\.).*)",
  ],
};
