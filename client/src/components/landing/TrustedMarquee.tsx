const professions = [
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

const marqueeItems = [...professions, ...professions].map((name, i) => ({
  name,
  key: `${name}-${i}`,
}));

export default function TrustedMarquee() {
  return (
    <div className="bg-cream-2 py-12">
      <div className="max-w-[1080px] mx-auto overflow-hidden marquee-wrapper">
        <p className="text-[11px] tracking-[0.12em] uppercase text-ink-3 text-center mb-7 font-medium">
          Trusted by professionals in every field
        </p>
        <div className="space-y-3">
          <div
            className="flex animate-marquee whitespace-nowrap"
            aria-hidden="true"
          >
            {marqueeItems.map((item) => (
              <span
                key={`a-${item.key}`}
                className="text-[15px] font-medium text-ink-2 flex-shrink-0 mx-4 inline-flex items-center"
              >
                {item.name}
                <span className="text-gold ml-4">·</span>
              </span>
            ))}
          </div>
          <div
            className="flex animate-marquee-reverse whitespace-nowrap"
            aria-hidden="true"
          >
            {[...marqueeItems].reverse().map((item) => (
              <span
                key={`b-${item.key}`}
                className="text-[15px] font-medium text-ink-2 flex-shrink-0 mx-4 inline-flex items-center"
              >
                {item.name}
                <span className="text-gold ml-4">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
