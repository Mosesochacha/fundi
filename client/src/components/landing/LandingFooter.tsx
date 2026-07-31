import Image from "next/image";
import Link from "next/link";

const LINK_CLASS =
  "group inline-flex items-center gap-2 py-1.5 text-[14px] text-ink-2 no-underline transition-colors hover:text-gold-deep";

/** A footer entry navigates (href) or is a not-yet-built placeholder (no href). */
type FooterLink = { label: string; href?: string };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Browse the work", href: "/browse" },
      { label: "Join as a worker", href: "/register" },
      { label: "How it works", href: "/#how" },
      { label: "Trust & safety", href: "/#trust" },
    ],
  },
  {
    heading: "Trades",
    links: [
      { label: "Plumbers", href: "/browse" },
      { label: "Electricians", href: "/browse" },
      { label: "Carpenters", href: "/browse" },
      { label: "All categories", href: "/browse" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Where we operate", href: "/#global" },
    ],
  },
];

function FooterEntry({ link }: { link: FooterLink }) {
  const inner = (
    <>
      <span className="h-px w-0 bg-gold transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-3.5" />
      {link.label}
    </>
  );

  if (link.href) {
    return (
      <Link href={link.href} className={LINK_CLASS}>
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={`${LINK_CLASS} cursor-pointer border-none bg-transparent p-0 text-left`}
    >
      {inner}
    </button>
  );
}

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-cream px-5 pt-16 pb-10 md:px-8">
      {/* Emblem watermark — clipped by the footer edge, never a focal point */}
      <Image
        src="/brand/emblem.png"
        alt=""
        aria-hidden="true"
        width={192}
        height={192}
        className="pointer-events-none absolute -right-16 -bottom-16 h-60 w-60 opacity-[0.04] select-none"
      />

      <div className="relative mx-auto w-full max-w-[1120px]">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-b border-border pb-12 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:gap-x-12">
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/brand/lightlogo.png"
              alt="Tesilix"
              width={1027}
              height={219}
              className="h-10 w-auto"
            />
            <p className="mt-5 max-w-[30ch] text-[14px] leading-[1.65] text-ink-2">
              A portfolio-first hiring network for skilled trades. The work
              speaks; the worker keeps the fee.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold-deep">
                Early access
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
                {col.heading}
              </h2>
              <div className="flex flex-col items-start">
                {col.links.map((link) => (
                  <FooterEntry key={link.label} link={link} />
                ))}
              </div>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start gap-3 pt-7 text-[13px] text-ink-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
          <span className="tabular-nums">
            © 2026 Tesilix Technologies Ltd. All rights reserved.
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
            Skilled work, verified
          </span>
        </div>
      </div>
    </footer>
  );
}
