import type {
  Certification,
  EducationItem,
  ExperienceItem,
  PortfolioPhoto,
  RatingBucket,
  ReviewItem,
} from "@/components/worker/workerProfileData";
import { API_BASE } from "@/lib/apiBase";
import { serverFetch } from "@/lib/serverFetch";

/**
 * Public worker profile returned by `GET /worker/:id/profile`. The endpoint now
 * returns the full showcase payload to anonymous viewers too (portfolio,
 * experience, certs, education), so this is a superset of `WorkerProfileData` —
 * the logged-out profile view renders the exact same rich component as the
 * signed-in one. Used for SSR metadata, JSON-LD and the public profile view.
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
  bannerUrl: string | null;
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
  serviceAreas: string[];
  portfolio: PortfolioPhoto[];
  experience: ExperienceItem[];
  certifications: Certification[];
  education: EducationItem[];
  reviews: ReviewItem[];
  ratingBreakdown: RatingBucket[];
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
    const res = await serverFetch(
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
