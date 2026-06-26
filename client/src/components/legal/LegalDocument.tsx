"use client";

import { ArrowUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode, useEffect, useState } from "react";
import LandingNav from "@/components/landing/LandingNav";
import { cn } from "@/lib/utils";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "lines"; items: string[] };

export type LegalSection = {
  /** "1", "2", … — also used to build the anchor id. */
  number: string;
  title: string;
  blocks: LegalBlock[];
};

const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

/** Render a verbatim string, turning any email address into a mailto link. */
function withLinks(text: string): ReactNode {
  const parts = text.split(EMAIL_RE);
  return parts.map((part, i) =>
    EMAIL_RE.test(part) ? (
      <a
        key={`${i}-${part}`}
        href={`mailto:${part}`}
        className="text-gold-dark hover:underline"
      >
        {part}
      </a>
    ) : (
      <Fragment key={`${i}-${part}`}>{part}</Fragment>
    ),
  );
}

const sectionId = (number: string) => `section-${number}`;

export default function LegalDocument({
  docTitle,
  effectiveDate,
  sections,
}: {
  docTitle: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  const [showTop, setShowTop] = useState(false);
  const [activeId, setActiveId] = useState<string>(
    sections[0] ? sectionId(sections[0].number) : "",
  );

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(sectionId(s.number)))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-100px 0px -65% 0px", threshold: 0 },
    );
    els.forEach((el) => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen flex flex-col bg-cream font-sans text-ink-2">
      <LandingNav />

      <div className="flex-1 w-full">
        <div className="mx-auto flex w-full max-w-[1180px] gap-10 px-6 pt-[88px]">
          <aside className="hidden lg:block w-[200px] shrink-0">
            <nav className="sticky top-[96px] py-12">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                On this page
              </p>
              <ul className="flex flex-col gap-2.5">
                {sections.map((s) => {
                  const id = sectionId(s.number);
                  const active = id === activeId;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        className={cn(
                          "block text-[11px] uppercase tracking-[0.06em] leading-snug transition-colors",
                          active
                            ? "text-gold-dark font-semibold"
                            : "text-ink-3 hover:text-ink-2",
                        )}
                      >
                        {s.number}. {s.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <main className="w-full max-w-[760px] mx-auto py-12">
            <header className="border-b border-border pb-7">
              <p className="font-serif text-4xl font-normal leading-none text-navy">
                Tesilix
              </p>
              <h1 className="mt-2 font-serif text-2xl font-normal text-gold-dark">
                {docTitle}
              </h1>
              <p className="mt-3 text-[13px] text-ink-3">
                Effective Date: {effectiveDate}
              </p>
            </header>

            <div className="mt-8 flex flex-col gap-9">
              {sections.map((s) => (
                <section
                  key={s.number}
                  id={sectionId(s.number)}
                  className="scroll-mt-24"
                >
                  <h2 className="font-serif text-[22px] font-normal text-navy">
                    {s.number}. {s.title}
                  </h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {s.blocks.map((block, i) => (
                      <BlockView key={`${block.type}-${i}`} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </main>
        </div>
      </div>

      <footer className="border-t border-border px-6 py-7 flex flex-col items-center gap-3 text-sm text-ink-3">
        <Link href="/" className="inline-flex items-center no-underline">
          <Image
            src="/brand/lightlogo.png"
            alt="Tesilix"
            width={1027}
            height={219}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex gap-4 justify-center">
          <span>© 2026 Tesilix Technologies Ltd.</span>
          <Link href="/privacy" className="text-ink-3 hover:text-ink-2">
            Privacy
          </Link>
          <Link href="/terms" className="text-ink-3 hover:text-ink-2">
            Terms
          </Link>
        </div>
      </footer>

      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={cn(
          "fixed bottom-6 right-6 z-[120] flex h-11 w-11 items-center justify-center rounded-full bg-gold text-navy shadow-lg transition-all hover:bg-gold-dark hover:text-white",
          showTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none",
        )}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

function BlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-sm leading-[1.8] text-ink-2">
          {withLinks(block.text)}
        </p>
      );
    case "h2":
      return (
        <h3 className="mt-2 text-[15px] font-semibold text-navy">
          {block.text}
        </h3>
      );
    case "h3":
      return (
        <h4 className="mt-1 text-sm font-semibold text-ink-2">{block.text}</h4>
      );
    case "ul":
      return (
        <ul className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <li
              key={`${i}-${item}`}
              className="relative pl-6 text-sm leading-[1.8] text-ink-2 before:absolute before:left-1 before:text-gold-dark before:content-['•']"
            >
              {withLinks(item)}
            </li>
          ))}
        </ul>
      );
    case "lines":
      return (
        <div className="flex flex-col gap-0.5 text-sm leading-[1.8] text-ink-2">
          {block.items.map((item, i) => (
            <span key={`${i}-${item}`}>{withLinks(item)}</span>
          ))}
        </div>
      );
  }
}
