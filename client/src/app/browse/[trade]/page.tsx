import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { getBrowseListing } from "@/lib/browseSeo";
import {
  absoluteUrl,
  formatTrade,
  pluralizeTrade,
  TRADE_NAMES,
  tradeSlug,
} from "@/lib/seo";
import BrowseClient from "../BrowseClient";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ trade: string }> };

export function generateStaticParams() {
  return TRADE_NAMES.map((name) => ({ trade: tradeSlug(name) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { trade: slug } = await params;
  const trade = formatTrade(slug);
  const plural = pluralizeTrade(trade);
  const { total } = await getBrowseListing({ trade, limit: 1 });
  const canonical = absoluteUrl(`/browse/${slug}`);
  const countLabel = total > 0 ? `${total} ` : "";

  return {
    title: { absolute: `${plural} for Hire | Tesilix` },
    description: `Hire verified ${plural.toLowerCase()} on Tesilix. Browse ${countLabel}available ${plural.toLowerCase()}, read reviews, and book today.`,
    alternates: { canonical },
    openGraph: {
      title: `${plural} for Hire | Tesilix`,
      description: `${countLabel}verified ${plural.toLowerCase()} available on Tesilix.`,
      url: canonical,
      type: "website",
    },
  };
}

export default async function BrowseTradePage({ params }: Params) {
  const { trade: slug } = await params;
  const trade = formatTrade(slug);
  const plural = pluralizeTrade(trade);
  const { workers, response } = await getBrowseListing({ trade });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${plural} for hire`,
    numberOfItems: workers.length,
    itemListElement: workers.map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/worker/${w.username}`),
      name: w.name,
    })),
  };

  return (
    <>
      <JsonLd data={itemList} />
      <BrowseClient initialData={response} initialTrade={trade} />
    </>
  );
}
