import Image from "next/image";
import Link from "next/link";

const LINK_CLASS =
  "block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white";
const BTN_CLASS = `${LINK_CLASS} no-underline bg-transparent border-none p-0 text-left cursor-pointer`;

/** A footer entry navigates (href) or is a not-yet-built placeholder (no href). */
type FooterLink = { label: string; href?: string };

const COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Platform",
    links: [
      { label: "Find a worker", href: "/browse" },
      { label: "Post a job" },
      { label: "Join as a worker", href: "/register" },
      { label: "Pricing" },
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
      { label: "About" },
      { label: "Blog" },
      { label: "Careers" },
      { label: "Contact" },
    ],
  },
];

function FooterEntry({ link }: { link: FooterLink }) {
  if (link.href) {
    return (
      <Link href={link.href} className={`${LINK_CLASS} no-underline`}>
        {link.label}
      </Link>
    );
  }
  return (
    <button type="button" className={BTN_CLASS}>
      {link.label}
    </button>
  );
}

export default function LandingFooter() {
  return (
    <footer className="bg-navy px-6 pt-16 pb-10">
      <div className="max-w-[1080px] mx-auto">
        <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-7 md:gap-12 pb-12 border-b border-white/[0.07]">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <Image
                src="/brand/darklogo.png"
                alt="Tesilix"
                width={1027}
                height={219}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-[13px] text-white/40 leading-[1.7] md:max-w-[240px]">
              The home for blue-collar workers in Kenya - built for the people
              who build the world.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div className="text-[11px] tracking-[0.1em] uppercase text-white/85 font-medium mb-4">
                {col.heading}
              </div>
              {col.links.map((link) => (
                <FooterEntry key={link.label} link={link} />
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col min-[480px]:flex-row min-[480px]:justify-between min-[480px]:items-center items-start pt-8 text-xs text-white/25 gap-3 flex-wrap">
          <div>© 2026 Tesilix Technologies Ltd. All rights reserved.</div>
          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="text-[13px] text-white/40 no-underline transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[13px] text-white/40 no-underline transition-colors hover:text-white"
            >
              Terms
            </Link>
            <button
              type="button"
              className="text-[13px] text-white/40 transition-colors hover:text-white bg-transparent border-none p-0 cursor-pointer"
            >
              Safety
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
