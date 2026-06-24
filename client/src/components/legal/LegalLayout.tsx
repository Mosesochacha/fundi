import Link from "next/link";
import type { ReactNode } from "react";
import LandingNav from "@/components/landing/LandingNav";

/**
 * Shared shell for the static legal pages (/terms, /privacy). Landing nav on
 * top, a readable centred article, and the standard footer links.
 */
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans text-ink-2">
      <LandingNav />

      <main className="flex-1 w-full max-w-[760px] mx-auto px-6 pt-[104px] pb-16">
        <h1 className="font-serif text-4xl font-normal text-ink leading-[1.15]">
          {title}
        </h1>
        <p className="mt-2 text-[13px] text-ink-3">Last updated {updated}</p>

        <div className="legal-body mt-7">{children}</div>

        <p className="mt-10 text-[13px] text-ink-3">
          Questions? Email{" "}
          <a
            href="mailto:support@tesilix.mosesochacha.online"
            className="text-gold-dark"
          >
            support@tesilix.mosesochacha.online
          </a>
          .
        </p>
      </main>

      <footer className="border-t-[0.5px] border-border px-6 py-5 flex gap-4 justify-center text-[13px] text-ink-3">
        <span>© 2026 Tesilix</span>
        <Link href="/privacy" className="text-ink-3">
          Privacy
        </Link>
        <Link href="/terms" className="text-ink-3">
          Terms
        </Link>
      </footer>

      {/* Scoped typography for the article body (raw <h2>/<p>/<ul> from the
          legal pages, which carry no utility classes of their own). */}
      <style>{`
        .legal-body h2 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 19px;
          font-weight: 500;
          color: var(--color-ink);
          margin: 28px 0 8px;
        }
        .legal-body p { font-size: 15px; line-height: 1.7; margin: 0 0 12px; }
        .legal-body ul { margin: 0 0 12px; padding-left: 20px; }
        .legal-body li { font-size: 15px; line-height: 1.7; margin-bottom: 6px; }
        .legal-body a { color: var(--color-gold-dark); }
        .legal-body strong { color: var(--color-ink); }
      `}</style>
    </div>
  );
}
