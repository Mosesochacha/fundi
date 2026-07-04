import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FoundingMembers from "@/components/landing/FoundingMembers";
import GlobalSection from "@/components/landing/GlobalSection";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import TrustedMarquee from "@/components/landing/TrustedMarquee";
import TrustSafety from "@/components/landing/TrustSafety";
import WhyTesilix from "@/components/landing/WhyTesilix";
import JsonLd from "@/components/seo/JsonLd";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hire Skilled Workers — Anywhere",
  description:
    "Tesilix connects you with verified, rated tradespeople - plumbers, electricians, carpenters and more - in minutes, not days.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Tesilix — Hire Skilled Workers Anywhere",
    description:
      "Find verified, rated tradespeople near you - plumbers, electricians, carpenters and more.",
    url: SITE_URL,
    type: "website",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tesilix",
  url: SITE_URL,
  description: "Global marketplace for verified skilled workers.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: absoluteUrl("/browse/{trade}/{location}"),
    },
    "query-input": "required name=trade",
  },
};

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return (
    <div className="bg-cream text-ink font-sans overflow-x-hidden">
      <JsonLd data={websiteSchema} />
      <LandingNav />
      <main>
        <Hero />
        <TrustedMarquee />
        <HowItWorks />
        <WhyTesilix />
        <GlobalSection />
        <FoundingMembers />
        <TrustSafety />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
