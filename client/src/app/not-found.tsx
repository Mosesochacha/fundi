import type { Metadata } from "next";
import HomeButton from "@/components/landing/HomeButton";
import LandingNav from "@/components/landing/LandingNav";

export const metadata: Metadata = {
  title: "404 — Page not found | Tesilix",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink font-sans">
      <LandingNav />

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="max-w-[440px] text-center">
          {/* 404 number with blurred gold shadow layer */}
          <div className="relative inline-block mb-4">
            <span
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none font-serif text-[130px] font-normal text-gold tracking-[-0.04em] opacity-10 blur-[12px]"
            >
              404
            </span>
            <span className="relative font-serif text-[130px] font-normal text-navy tracking-[-0.04em] leading-none">
              404
            </span>
          </div>

          <h1 className="font-serif text-[26px] font-normal text-navy mb-2.5 leading-tight">
            This page went{" "}
            <em className="italic font-light text-gold">missing.</em>
          </h1>

          <p className="text-sm text-ink-3 leading-relaxed mb-9">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          <HomeButton />
        </div>
      </main>

      <footer className="bg-cream px-12 py-5 border-t-[0.5px] border-border text-center text-[11px] text-ink-3">
        Privacy · Terms
      </footer>
    </div>
  );
}
