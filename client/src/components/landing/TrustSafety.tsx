import type { ReactNode } from "react";
import { eyebrow, secTitle } from "./landingStyles";

const trustItems: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: "Identity verified",
    desc: "Every worker is phone-verified before going live. No fake profiles, no anonymous accounts.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: "Honest ratings",
    desc: "Only employers who completed a job can leave a review. Every star is earned, never bought.",
    icon: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
  },
  {
    title: "Safe contact",
    desc: "Your phone number is never shared until you explicitly confirm a job. Full control, always.",
    icon: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
  },
  {
    title: "Community moderation",
    desc: "Workers and employers can flag issues. Our team reviews all reports within 24 hours.",
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

export default function TrustSafety() {
  return (
    <section id="trust" className="bg-cream-2 px-5 py-16 md:px-6 md:py-24">
      <div className="max-w-[1080px] mx-auto">
        <div className={eyebrow}>Trust &amp; safety</div>
        <h2 className={secTitle}>
          We take trust
          <br />
          <em className="italic font-light text-gold-dark">seriously</em>
        </h2>
        <div className="reveal grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-8 mt-14">
          {trustItems.map((t) => (
            <div key={t.title} className="text-center">
              <div className="w-12 h-12 rounded-xl border border-border bg-white flex items-center justify-center mx-auto mb-4">
                <svg
                  viewBox="0 0 24 24"
                  className="w-[22px] h-[22px] stroke-gold-dark fill-none [stroke-width:1.5]"
                  aria-hidden="true"
                >
                  {t.icon}
                </svg>
              </div>
              <div className="text-sm font-medium text-ink mb-1.5">
                {t.title}
              </div>
              <div className="text-sm text-ink-2 leading-[1.6] font-light">
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
