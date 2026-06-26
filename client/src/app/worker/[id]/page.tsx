import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import { getPublicWorker, type PublicWorkerData } from "@/lib/publicProfile";
import { absoluteUrl } from "@/lib/seo";
import WorkerProfileGate from "./WorkerProfileGate";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const worker = await getPublicWorker(id);
  if (!worker) return { title: "Worker not found" };

  const canonical = absoluteUrl(`/worker/${worker.username}`);
  const title = `${worker.name} — ${worker.trade}${
    worker.location ? ` in ${worker.location}` : ""
  } | Tesilix`;
  const jobsLine =
    worker.jobsDone > 0 ? ` ${worker.jobsDone} completed jobs.` : "";
  const ratingLine =
    worker.reviewCount > 0 ? ` ${worker.rating.toFixed(1)} star rating.` : "";
  const description = `${worker.name} is a${
    worker.isVerified ? " verified" : ""
  } ${worker.trade}${
    worker.location ? ` in ${worker.location}` : ""
  }.${jobsLine}${ratingLine} Available for hire on Tesilix.`;

  const images = worker.avatarUrl ? [worker.avatarUrl] : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title: `${worker.name} | Tesilix`,
      description: `${worker.isVerified ? "Verified " : ""}${worker.trade}${
        worker.location ? ` in ${worker.location}` : ""
      }.${jobsLine} Book today.`,
      url: canonical,
      type: "profile",
      images,
    },
    twitter: {
      card: "summary",
      title: `${worker.name} — ${worker.trade} | Tesilix`,
      description: `${worker.isVerified ? "Verified " : ""}${worker.trade}${
        worker.location ? ` in ${worker.location}` : ""
      }.`,
    },
  };
}

function personSchema(worker: PublicWorkerData) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: worker.name,
    jobTitle: worker.trade,
    url: absoluteUrl(`/worker/${worker.username}`),
    address: {
      "@type": "PostalAddress",
      addressLocality: worker.location || undefined,
      addressCountry: worker.country || undefined,
    },
  };
  if (worker.avatarUrl) schema.image = worker.avatarUrl;
  // Only emit ratings when they're real — fake/zero ratings risk a penalty.
  if (worker.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: worker.rating,
      reviewCount: worker.reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }
  if (worker.dailyRate > 0) {
    schema.priceRange = `${worker.currencySymbol}${worker.dailyRate}/day`;
  }
  return schema;
}

export default async function WorkerProfilePage({ params }: Params) {
  const { id } = await params;
  const worker = await getPublicWorker(id);
  if (!worker) notFound();

  return (
    <>
      <JsonLd data={personSchema(worker)} />
      <WorkerProfileGate id={id} initial={worker} />
    </>
  );
}
