import type { MetadataRoute } from "next";
import { API_BASE } from "@/lib/apiBase";
import {
  absoluteUrl,
  CITY_NAMES,
  locationSlug,
  SITE_URL,
  TRADE_NAMES,
  tradeSlug,
} from "@/lib/seo";
import { serverFetch } from "@/lib/serverFetch";

export const revalidate = 3600;

interface WorkerSlug {
  username: string;
  updatedAt: string | null;
}

async function getWorkerSlugs(): Promise<WorkerSlug[]> {
  try {
    const res = await serverFetch(`${API_BASE}/seo/worker-slugs`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json?.data?.workers as WorkerSlug[]) ?? [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: absoluteUrl("/browse"), priority: 0.9, changeFrequency: "hourly" },
    { url: absoluteUrl("/login"), priority: 0.3, changeFrequency: "monthly" },
    {
      url: absoluteUrl("/register"),
      priority: 0.4,
      changeFrequency: "monthly",
    },
    { url: absoluteUrl("/terms"), priority: 0.2, changeFrequency: "monthly" },
    { url: absoluteUrl("/privacy"), priority: 0.2, changeFrequency: "monthly" },
  ];

  const browsePages: MetadataRoute.Sitemap = TRADE_NAMES.flatMap((name) => {
    const t = tradeSlug(name);
    return [
      {
        url: absoluteUrl(`/browse/${t}`),
        priority: 0.9,
        changeFrequency: "hourly" as const,
      },
      ...CITY_NAMES.map((city) => ({
        url: absoluteUrl(`/browse/${t}/${locationSlug(city)}`),
        priority: 0.8,
        changeFrequency: "hourly" as const,
      })),
    ];
  });

  const slugs = await getWorkerSlugs();
  const workerPages: MetadataRoute.Sitemap = slugs.map(
    ({ username, updatedAt }) => ({
      url: absoluteUrl(`/worker/${username}`),
      lastModified: updatedAt ? new Date(updatedAt) : undefined,
      priority: 0.7,
      changeFrequency: "weekly",
    }),
  );

  return [...staticPages, ...browsePages, ...workerPages];
}
