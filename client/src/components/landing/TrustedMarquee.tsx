const TRADES = [
  "Plumbers",
  "Electricians",
  "Carpenters",
  "Masons",
  "Welders",
  "Painters",
  "Mechanics",
  "Tilers",
  "Roofers",
  "Cleaners",
  "Tailors",
  "Landscapers",
  "Chefs",
  "AC Technicians",
];

/**
 * A set-in-type ticker rather than a logo strip — we have no client logos to
 * borrow credibility from, so the marquee carries the trades themselves.
 * `.animate-marquee` shifts the track -50%, so the list is rendered twice; the
 * second copy is hidden from AT. `.marquee-wrapper` supplies hover-to-pause and
 * globals.css disables the animation under prefers-reduced-motion.
 */
export default function TrustedMarquee() {
  return (
    <section className="border-y border-border bg-cream-2 py-7 md:py-9">
      <div className="marquee-wrapper flex items-center gap-6 overflow-hidden md:gap-10">
        <span className="hidden shrink-0 items-center gap-3 pl-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep md:flex">
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          On the network
        </span>

        <div className="min-w-0 flex-1 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          <div className="animate-marquee flex w-max items-center">
            {[0, 1].map((copy) => (
              <ul
                key={copy}
                aria-hidden={copy === 1}
                className="flex w-max items-center"
              >
                {TRADES.map((trade) => (
                  <li
                    key={trade}
                    className="flex shrink-0 items-center gap-7 pr-7 md:gap-10 md:pr-10"
                  >
                    <span className="font-serif text-[22px] font-light whitespace-nowrap text-ink-2 md:text-[27px]">
                      {trade}
                    </span>
                    <span className="h-[5px] w-[5px] rotate-45 bg-gold" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
