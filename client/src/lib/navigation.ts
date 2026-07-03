import type { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

let router: AppRouter | null = null;

/**
 * Registered once by <Providers>. Lets non-component code (axios interceptors)
 * navigate through the App Router instead of window.location, keeping
 * client-side state transitions and avoiding full page reloads.
 */
export function registerRouter(r: AppRouter): void {
  router = r;
}

/**
 * Replace-navigate via the App Router and refresh server components so
 * auth-dependent layouts re-evaluate against the current session cookie.
 */
export function replaceAndRefresh(path: string): void {
  router?.replace(path);
  router?.refresh();
}
