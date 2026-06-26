import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { getBrowseListing } from "@/lib/browseSeo";
import {
  absoluteUrl,
  CITY_NAMES,
  formatLocation,
  formatTrade,
  locationSlug,
  pluralizeTrade,
  TRADE_NAMES,
  tradeSlug,
} from "@/lib/seo";
import BrowseClient from "../../BrowseClient";

export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ trade: string; location: string }> };

export function generateStaticParams() {
  return TRADE_NAMES.flatMap((name) =>
    CITY_NAMES.map((city) => ({
      trade: tradeSlug(name),
      location: locationSlug(city),
    })),
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { trade: tradeS, location: locS } = await params;
  const trade = formatTrade(tradeS);
  const plural = pluralizeTrade(trade);
  const location = formatLocation(locS);
  const { total } = await getBrowseListing({ trade, location, limit: 1 });
  const canonical = absoluteUrl(`/browse/${tradeS}/${locS}`);
  const countLabel = total > 0 ? `${total} ` : "";

  return {
    title: { absolute: `${plural} in ${location} | Tesilix` },
    description: `Hire verified ${plural.toLowerCase()} in ${location}. Browse ${countLabel}available ${plural.toLowerCase()}, read reviews, and book today.`,
    alternates: { canonical },
    openGraph: {
      title: `${plural} in ${location} | Tesilix`,
      description: `${countLabel}verified ${plural.toLowerCase()} available in ${location}.`,
      url: canonical,
      type: "website",
    },
  };
}

export default async function BrowseTradeLocationPage({ params }: Params) {
  const { trade: tradeS, location: locS } = await params;
  const trade = formatTrade(tradeS);
  const plural = pluralizeTrade(trade);
  const location = formatLocation(locS);
  const { workers, response } = await getBrowseListing({ trade, location });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${plural} in ${location}`,
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
      <BrowseClient
        initialData={response}
        initialTrade={trade}
        initialLocation={location}
      />
    </>
  );
}
