import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import type { BrowseWorkersResponse } from "@/features/browse";
import { API_BASE } from "@/lib/apiBase";
import BrowseClient from "./BrowseClient";

// Find-a-Fundi typography: Newsreader (serif) for display + Hanken Grotesk (sans)
// for body. Exposed as CSS variables consumed by browse.css, scoped to .browse.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    title: "Browse Skilled Workers Near You | Fundi",
    description:
      "Find verified plumbers, electricians, carpenters and more. Browse 48,000+ skilled workers worldwide. Free to use.",
  };
}

async function getInitialWorkers(): Promise<BrowseWorkersResponse | undefined> {
  try {
    const res = await fetch(
      `${API_BASE}/browse/workers?available=false&verified=false&minRating=0&minRate=500&maxRate=10000&sort=best_match&page=1&limit=12`,
      { cache: "no-store" },
    ).then((r) => r.json());
    return (res?.data as BrowseWorkersResponse) ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function BrowsePage() {
  const initialData = await getInitialWorkers();
  return (
    <BrowseClient
      initialData={initialData}
      fontClass={`${newsreader.variable} ${hanken.variable}`}
    />
  );
}
