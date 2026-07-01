import type { Metadata } from "next";
import type { BrowseWorkersResponse } from "@/features/browse";
import { API_BASE } from "@/lib/apiBase";
import { serverFetch } from "@/lib/serverFetch";
import BrowseClient from "./BrowseClient";

export function generateMetadata(): Metadata {
  return {
    title: "Browse Skilled Workers Near You | Tesilix",
    description:
      "Find verified plumbers, electricians, carpenters and more. Browse 48,000+ skilled workers worldwide. Free to use.",
  };
}

async function getInitialWorkers(): Promise<BrowseWorkersResponse | undefined> {
  try {
    const res = await serverFetch(
      `${API_BASE}/browse/workers?available=false&verified=false&minRating=0&minRate=0&maxRate=0&sort=best_match&page=1&limit=12`,
      { cache: "no-store" },
    ).then((r) => r.json());
    return (res?.data as BrowseWorkersResponse) ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function BrowsePage() {
  const initialData = await getInitialWorkers();
  return <BrowseClient initialData={initialData} />;
}
