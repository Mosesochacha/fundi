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
  const seg = path.split("/")[2]; // "/worker/<seg>/..."
  return !!seg && WORKER_PROTECTED.includes(seg);
};

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;
  // OAuth users sign in before choosing worker/employer - they must finish
  // /onboarding before reaching any role area.
  const complete = !!session?.backendUser?.isProfileComplete;

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
  const toOnboarding = () => {
    const url = nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  };

  // The onboarding completion flow - logged in, but no role check.
  if (matches(path, "/onboarding")) {
    if (!session) return toLogin();
    if (complete) return toDashboard();
    return NextResponse.next();
  }

  // Already signed in → keep them out of the auth screens.
  if (AUTH_ONLY.some((p) => matches(path, p))) {
    if (!session) return NextResponse.next();
    return complete ? toDashboard() : toOnboarding();
  }

  // Worker area.
  //  • /worker/[id] profile pages are fully PUBLIC (logged-out visitors and
  //    crawlers must reach them for SEO indexing). They self-gate content
  //    server-side: anonymous viewers get a minimal profile, signed-in get more.
  //  • Worker-only app pages (WORKER_PROTECTED) require a signed-in, onboarded
  //    worker.
  if (matches(path, "/worker")) {
    if (!isProtectedWorkerPath(path)) return NextResponse.next();
    if (!session) return toLogin();
    if (!complete) return toOnboarding();
    if (role !== "worker") return toDashboard();
    return NextResponse.next();
  }

  // Blanket role-gated areas (employer/admin/moderator).
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
  // Run on every route except static assets and files with an extension.
  // The handler allow-lists public paths via fallthrough, so broad coverage
  // here is defense-in-depth: a new protected page can't ship unguarded.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images|.*\\.).*)",
  ],
};
