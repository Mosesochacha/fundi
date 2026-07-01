/**
 * Server-only fetch helper. Do not import from Client Components — overriding
 * `User-Agent` only works off the browser (it's a forbidden header there).
 *
 * User-Agent the backend's security middleware explicitly whitelists for the
 * Next server's own first-party API calls (see backend `security.ts`). Requests
 * made from the server have no browser UA and no `Referer`, so without this
 * header the API rejects them with `403 "Access denied - browser required"` —
 * which silently turns SSR data (worker profiles, browse, sitemap) into 404s.
 */
export const SERVER_API_UA = "Frontend-API-Proxy";

/**
 * `fetch` for server-only API calls. Injects the whitelisted User-Agent so the
 * request passes the API's browser-required guard, while still honouring any
 * caller-supplied `init` (method, body, cache, `next.revalidate`, extra headers).
 */
export function serverFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: { ...init.headers, "User-Agent": SERVER_API_UA },
  });
}
