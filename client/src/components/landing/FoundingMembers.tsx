import { eyebrow, secTitle } from "./landingStyles";

const foundingBenefits = [
  {
    title: "Founding badge",
    desc: "Everyone who joins during early access keeps a founding-member badge on their profile - forever.",
  },
  {
    title: "Lifetime free",
    desc: "Founding workers never pay. No subscriptions, no listing fees, no commission. Locked in from day one.",
  },
  {
    title: "Shape the platform",
    desc: "Tell us what you need to win more work. Early members directly influence what we build next.",
  },
];

export default function FoundingMembers() {
  return (
    <section className="bg-cream px-5 py-16 md:px-6 md:py-24">
      <div className="max-w-[1080px] mx-auto">
        <div className={eyebrow}>Founding members</div>
        <h2 className={secTitle}>
          Get in early.
          <br />
          <em className="italic font-light text-gold-dark">Grow with us.</em>
        </h2>
        <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-4 mt-14">
          {foundingBenefits.map((b) => (
            <div
              key={b.title}
              className="bg-white border border-border rounded-xl px-6 py-7"
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.04em] uppercase text-gold-deep bg-gold-light border border-gold/30 rounded-full px-3 py-1 mb-[18px]">
                <span className="text-gold-deep">★</span> Founding
              </div>
              <div className="font-serif text-xl font-normal text-ink mb-2.5">
                {b.title}
              </div>
              <p className="text-sm text-ink-2 leading-[1.7] font-light">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
