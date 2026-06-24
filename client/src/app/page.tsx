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
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";

export const metadata: Metadata = {
  title: "Hire Skilled Workers Near You",
  description:
    "Tesilix connects you with verified, rated tradespeople - plumbers, electricians, carpenters and more - in minutes, not days.",
};

export default async function LandingPage() {
  // Signed-in users don't see the landing page - send them to their dashboard.
  const session = await auth();
  if (session?.user) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return (
    <div className="bg-cream text-ink font-sans overflow-x-hidden">
      <LandingNav />
      <Hero />
      <TrustedMarquee />
      <HowItWorks />
      <WhyTesilix />
      <GlobalSection />
      <FoundingMembers />
      <TrustSafety />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
