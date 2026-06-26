import { API_BASE } from "@/lib/apiBase";

/**
 * Minimal, public worker profile returned by `GET /worker/:id/profile` for
 * anonymous viewers (no auth header). Mirrors the backend's minimal `shapeProfile`
 * payload — used for SSR metadata, JSON-LD and the logged-out profile view.
 */
export interface PublicWorkerData {
  id: string;
  username: string;
  name: string;
  initials: string;
  trade: string;
  yearsExperience: number;
  location: string;
  country: string | null;
  avatarUrl: string | null;
  currency: string;
  currencySymbol: string;
  isVerified: boolean;
  isAvailable: boolean;
  phoneVerified: boolean;
  rating: number;
  reviewCount: number;
  jobsDone: number;
  dailyRate: number;
  about: string;
  services: string[];
}

/**
 * Server-side fetch of the public profile (no auth → minimal payload).
 * Revalidated hourly so profile edits surface without a redeploy. Returns null
 * on 404 / network error so callers can render notFound().
 */
export async function getPublicWorker(
  id: string,
): Promise<PublicWorkerData | null> {
  try {
    const res = await fetch(
      `${API_BASE}/worker/${encodeURIComponent(id)}/profile`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as PublicWorkerData) ?? null;
  } catch {
    return null;
  }
}
