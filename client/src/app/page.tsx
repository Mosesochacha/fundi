import type { Metadata } from "next";
import { redirect } from "next/navigation";
import FoundingMembers from "@/components/landing/FoundingMembers";
import GlobalSection from "@/components/landing/GlobalSection";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingCta from "@/components/landing/LandingCta";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingMotion from "@/components/landing/LandingMotion";
import LandingNav from "@/components/landing/LandingNav";
import TrustedMarquee from "@/components/landing/TrustedMarquee";
import TrustSafety from "@/components/landing/TrustSafety";
import WhyTesilix from "@/components/landing/WhyTesilix";
import JsonLd from "@/components/seo/JsonLd";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tesilix - Skilled Work, Verified",
  description:
    "Tesilix is a work network and hiring marketplace where skilled workers build trusted profiles and employers find verified tradespeople.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Tesilix - Skilled Work, Verified",
    description:
      "A marketplace for blue-collar and skilled workers to showcase their work, earn trust, and connect with employers.",
    url: SITE_URL,
    type: "website",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Tesilix",
  url: SITE_URL,
  description:
    "A work network and marketplace for verified skilled workers and the employers who hire them.",
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
      <LandingMotion />
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
