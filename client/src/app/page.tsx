import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import LandingNav from "@/components/landing/LandingNav";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";

export const metadata: Metadata = {
  title: "Hire Skilled Workers Near You",
  description:
    "Tesilix connects you with verified, rated tradespeople — plumbers, electricians, carpenters and more — in minutes, not days.",
};

// ─── Data ────────────────────────────────────────────────────────────────────

// Reused "Trusted by professionals in every field" marquee content
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

const reasons: {
  num: string;
  title: ReactNode;
  desc: string;
  icon: ReactNode;
}[] = [
  {
    num: "01",
    title: (
      <>
        Every worker is{" "}
        <em className="italic font-light text-gold">verified</em>
      </>
    ),
    desc: "Phone-confirmed identity on every profile. No anonymous strangers, no fake accounts. You know exactly who is coming to your door.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    num: "02",
    title: (
      <>
        Reviews you can{" "}
        <em className="italic font-light text-gold">actually trust</em>
      </>
    ),
    desc: "Only real employers who completed a job can leave a review. Not friends, not the worker themselves. Every star is earned honestly.",
    icon: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
  },
  {
    num: "03",
    title: (
      <>
        No brokers. <em className="italic font-light text-gold">No cuts.</em>
      </>
    ),
    desc: "Agents take 20–40% and give you no guarantee. On Tesilix you talk directly to the worker, agree your own price, and keep every shilling.",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    num: "04",
    title: (
      <>
        See work{" "}
        <em className="italic font-light text-gold">before you hire</em>
      </>
    ),
    desc: "Every worker profile shows real photos of past jobs. No more hiring blind and hoping the quality matches the promise.",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
  },
];

const mapDots = [
  { left: "52%", top: "55%", navy: false },
  { left: "42%", top: "48%", navy: false },
  { left: "47%", top: "42%", navy: true },
  { left: "55%", top: "38%", navy: false },
  { left: "60%", top: "44%", navy: true },
  { left: "48%", top: "60%", navy: false },
  { left: "38%", top: "52%", navy: true },
  { left: "65%", top: "50%", navy: false },
];

const globalStats = [
  {
    num: "Kenya",
    label:
      "Where we’re launching first — Nairobi and beyond. East Africa next.",
  },
  {
    num: "Founding",
    label: "Join the first cohort of workers shaping what Tesilix becomes.",
  },
  {
    num: "$0",
    label:
      "Cost to join as a worker. Free, always — no subscriptions, no fees.",
  },
];

const foundingBenefits = [
  {
    title: "Founding badge",
    desc: "Everyone who joins during early access keeps a founding-member badge on their profile — forever.",
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

const ctaAvatars: { initials: string; className: string }[] = [
  { initials: "JK", className: "bg-gold-light text-gold-dark" },
  { initials: "MO", className: "bg-navy/10 text-navy" },
  { initials: "AN", className: "bg-cream-2 text-ink-2" },
  { initials: "FN", className: "bg-gold/20 text-gold-dark" },
  { initials: "BM", className: "bg-gold-light text-gold-dark" },
];

const marqueeItems = [...professions, ...professions].map((name, i) => ({
  name,
  key: `${name}-${i}`,
}));

// ─── Shared style fragments ────────────────────────────────────────────────

const btnLg =
  "inline-flex items-center justify-center gap-1.5 px-8 py-3.5 rounded text-[15px] font-medium tracking-[0.01em] no-underline cursor-pointer border transition-all";
const btnGold = `${btnLg} bg-gold text-navy border-gold hover:bg-gold-dark hover:border-gold-dark`;
const btnOutlineNavy = `${btnLg} border-navy/25 bg-transparent text-navy hover:bg-navy/[0.05]`;
const eyebrow =
  "reveal text-[11px] tracking-[0.12em] uppercase text-gold-dark font-medium mb-4";
const secTitle =
  "reveal font-serif text-[clamp(30px,4vw,50px)] font-normal tracking-[-0.025em] leading-[1.1] text-ink";

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  // Signed-in users don't see the landing page — send them to their dashboard.
  const session = await auth();
  if (session?.user) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return (
    <div className="bg-cream text-ink font-sans overflow-x-hidden">
      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-[100px] pb-16 md:pt-[120px] md:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_55%_at_50%_0%,var(--color-gold-light)_0%,transparent_70%)]" />
        <h1 className="reveal font-serif text-[clamp(42px,7vw,86px)] font-normal leading-[1.05] tracking-[-0.03em] text-ink max-w-[820px]">
          Hire skilled workers.
          <br />
          <em className="italic font-light text-gold-dark">Anywhere.</em>{" "}
          Instantly.
        </h1>
        <p className="reveal text-[clamp(15px,2vw,18px)] text-ink-2 max-w-[480px] leading-[1.7] mt-6 font-light">
          The new home for Kenya’s skilled tradespeople — plumbers,
          electricians, carpenters and more. Browse profiles and connect
          directly. No brokers.
        </p>
        <div className="reveal flex flex-col sm:flex-row gap-3 mt-10 flex-wrap justify-center w-full max-w-[340px] sm:max-w-none">
          <Link href="/browse" className={`${btnGold} max-sm:w-full`}>
            Find a fundi near you
          </Link>
          <Link href="/register" className={`${btnOutlineNavy} max-sm:w-full`}>
            Join as a worker →
          </Link>
        </div>
        <div className="reveal flex items-center gap-x-6 gap-y-3 mt-12 flex-wrap justify-center">
          <div className="text-center">
            <div className="font-serif text-[28px] font-medium text-ink">
              Free
            </div>
            <div className="text-[11px] text-ink-3 tracking-[0.05em] uppercase mt-0.5">
              For workers, always
            </div>
          </div>
          <div className="hidden sm:block w-px h-9 bg-border" />
          <div className="text-center">
            <div className="font-serif text-[28px] font-medium text-ink">
              0%
            </div>
            <div className="text-[11px] text-ink-3 tracking-[0.05em] uppercase mt-0.5">
              Broker commission
            </div>
          </div>
          <div className="hidden sm:block w-px h-9 bg-border" />
          <div className="text-center">
            <div className="font-serif text-[28px] font-medium text-ink">
              Direct
            </div>
            <div className="text-[11px] text-ink-3 tracking-[0.05em] uppercase mt-0.5">
              No middleman
            </div>
          </div>
          <div className="hidden sm:block w-px h-9 bg-border" />
          <div className="text-center">
            <div className="font-serif text-[28px] font-medium text-ink">
              2 min
            </div>
            <div className="text-[11px] text-ink-3 tracking-[0.05em] uppercase mt-0.5">
              To get listed
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED-BY MARQUEE (reused) */}
      <div className="bg-cream-2 py-12 overflow-hidden marquee-wrapper">
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
                className="text-[15px] font-medium text-ink-4 flex-shrink-0 mx-4 inline-flex items-center"
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
                className="text-[15px] font-medium text-ink-4 flex-shrink-0 mx-4 inline-flex items-center"
              >
                {item.name}
                <span className="text-gold ml-4">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-cream-2 px-5 py-16 md:px-6 md:py-24">
        <div className="max-w-[1080px] mx-auto">
          <div className={eyebrow}>How it works</div>
          <h2 className={secTitle}>
            Three steps to
            <br />
            <em className="italic font-light text-gold-dark">
              a job done right
            </em>
          </h2>
          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-px mt-14 bg-border border border-border rounded-xl overflow-hidden">
            {[
              {
                num: "01",
                icon: (
                  <>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </>
                ),
                title: "Search your trade",
                desc: "Tell us what you need — plumber, electrician, carpenter. Filter by location, rating, and availability. Find the right person in seconds.",
              },
              {
                num: "02",
                icon: (
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                ),
                title: "Connect & confirm",
                desc: "Message directly, agree on price and time. No middlemen, no hidden fees. Every worker shows verified ratings from real past jobs.",
              },
              {
                num: "03",
                icon: (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                ),
                title: "Job done. Leave a review.",
                desc: "Rate the worker after the job. Your review helps the next employer and rewards great workers with more opportunities.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-cream px-6 py-8 md:px-8 md:py-10"
              >
                <div className="font-serif text-5xl font-light text-cream-2 leading-none mb-5">
                  {step.num}
                </div>
                <div className="w-10 h-10 rounded-lg bg-gold-light border border-gold/20 flex items-center justify-center mb-4">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 stroke-gold-dark fill-none [stroke-width:1.5]"
                    aria-hidden="true"
                  >
                    {step.icon}
                  </svg>
                </div>
                <div className="text-base font-medium text-ink mb-2">
                  {step.title}
                </div>
                <div className="text-sm text-ink-2 leading-[1.65] font-light">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TESILIX */}
      <section
        id="why"
        className="relative bg-navy px-5 py-16 md:px-6 md:py-24 overflow-hidden"
      >
        <div className="absolute top-1/2 -right-[200px] -translate-y-1/2 rounded-full border border-white/[0.04] w-[300px] h-[300px]" />
        <div className="absolute top-1/2 -right-[200px] -translate-y-1/2 rounded-full border border-white/[0.04] w-[500px] h-[500px]" />
        <div className="absolute top-1/2 -right-[200px] -translate-y-1/2 rounded-full border border-white/[0.04] w-[700px] h-[700px]" />
        <div className="relative max-w-[1080px] mx-auto">
          <div className="reveal text-[11px] tracking-[0.12em] uppercase text-gold font-medium mb-4">
            Why Tesilix
          </div>
          <h2 className="reveal font-serif text-[clamp(30px,4vw,50px)] font-normal tracking-[-0.025em] leading-[1.1] text-white">
            Stop guessing.
            <br />
            <em className="italic font-light text-gold">Start hiring right.</em>
          </h2>
          <p className="reveal text-[15px] text-white/45 font-light leading-[1.7] max-w-[420px] mt-4">
            WhatsApp groups, brokers, and word of mouth leave you hoping for the
            best. Tesilix gives you certainty.
          </p>
          <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.07] border border-white/[0.07] rounded-2xl overflow-hidden mt-14">
            {reasons.map((r) => (
              <div
                key={r.num}
                className="relative bg-navy px-[26px] py-8 md:px-9 md:py-10 transition-colors hover:bg-navy-2"
              >
                <div className="font-serif text-xs font-light text-gold tracking-[0.08em] mb-5 opacity-70">
                  {r.num}
                </div>
                <div className="font-serif text-[22px] font-normal text-white leading-tight mb-3">
                  {r.title}
                </div>
                <div className="text-sm text-white/45 leading-[1.7] font-light">
                  {r.desc}
                </div>
                <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px] stroke-gold/40 fill-none [stroke-width:1.5]"
                    aria-hidden="true"
                  >
                    {r.icon}
                  </svg>
                </div>
              </div>
            ))}
          </div>
          <div className="reveal mt-10 px-6 py-6 md:px-9 md:py-7 bg-gold/[0.08] border border-gold/15 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5">
            <p className="text-base text-white/60 font-light leading-[1.5]">
              <strong className="text-white font-medium">
                Still using WhatsApp groups?
              </strong>{" "}
              You deserve better than hoping someone replies.
            </p>
            <Link
              href="/browse"
              className={`${btnGold} max-sm:w-full whitespace-nowrap`}
            >
              Find a verified fundi →
            </Link>
          </div>
        </div>
      </section>

      {/* GLOBAL */}
      <section id="global" className="bg-cream-2 px-5 py-16 md:px-6 md:py-24">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="reveal">
            <div className="text-[11px] tracking-[0.12em] uppercase text-gold-dark font-medium mb-4">
              Where we start
            </div>
            <h2 className="font-serif text-[clamp(30px,4vw,50px)] font-normal tracking-[-0.025em] leading-[1.1] text-ink">
              Built for
              <br />
              <em className="italic font-light text-gold-dark">
                Kenya’s workers
              </em>
            </h2>
            <p className="text-[15px] text-ink-2 leading-[1.7] font-light max-w-[480px] mt-4">
              Starting in Nairobi and built to scale across East Africa. Join
              early and grow with us from day one.
            </p>
            <div className="flex flex-col gap-3.5 mt-10">
              {globalStats.map((s) => (
                <div
                  key={s.num}
                  className="flex items-center gap-4 p-4 bg-white border border-border rounded-lg"
                >
                  <div className="font-serif text-[22px] font-medium text-navy min-w-16">
                    {s.num}
                  </div>
                  <div className="text-[13px] text-ink-2 leading-[1.5]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal relative bg-white border border-border rounded-xl aspect-[4/3] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-[length:24px_24px]" />
            {mapDots.map((d) => (
              <span
                key={`${d.left}-${d.top}`}
                className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${d.navy ? "bg-navy" : "bg-gold"}`}
                style={{ left: d.left, top: d.top } as CSSProperties}
              />
            ))}
            <div className="relative z-[2] text-center">
              <div className="font-serif text-[32px] font-normal text-navy">
                Kenya
              </div>
              <div className="text-xs text-ink-3 tracking-[0.08em] uppercase mt-1">
                Launching 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDING MEMBERS */}
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
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.04em] uppercase text-gold-dark bg-gold-light border border-gold/30 rounded-full px-3 py-1 mb-[18px]">
                  <span className="text-gold">★</span> Founding
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

      {/* TRUST */}
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
                <div className="text-[13px] text-ink-2 leading-[1.6] font-light">
                  {t.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-[linear-gradient(135deg,var(--color-cream-2)_0%,var(--color-cream)_40%,var(--color-gold-light)_100%)] px-5 py-16 md:px-6 md:py-24 text-center overflow-hidden border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[320px] h-[320px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[520px] h-[520px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-navy/[0.06] w-[720px] h-[720px]" />
        <div className="relative">
          <h2 className="reveal font-serif text-[clamp(32px,4vw,52px)] font-normal tracking-[-0.025em] leading-[1.1] text-navy">
            Ready to find your
            <br />
            <em className="italic font-light text-gold-dark">
              next great fundi?
            </em>
          </h2>
          <p className="reveal text-base text-ink-2 max-w-[420px] mx-auto mt-4 leading-[1.7] font-light">
            Be one of the first fundis on the platform. Free to start, always —
            and free to stay.
          </p>
          <div className="reveal flex flex-col sm:flex-row gap-3 justify-center mt-10 flex-wrap w-full max-w-[340px] sm:max-w-none mx-auto">
            <Link href="/browse" className={`${btnGold} max-sm:w-full`}>
              Find a fundi now
            </Link>
            <Link
              href="/register"
              className={`${btnOutlineNavy} max-sm:w-full`}
            >
              Join as a worker →
            </Link>
          </div>
          <div className="reveal text-xs text-ink-3 mt-5 tracking-[0.03em]">
            Free forever for workers · No hidden fees · Cancel anytime
          </div>
          <div className="reveal flex items-center justify-center mt-11">
            <div className="flex">
              {ctaAvatars.map((a, i) => (
                <div
                  key={a.initials}
                  className={`w-9 h-9 rounded-full border-2 border-cream-2 flex items-center justify-center text-[11px] font-medium ${a.className} ${i === 0 ? "" : "-ml-2.5"}`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
            <div className="ml-3.5 text-left">
              <div className="text-xs text-ink-2">
                Founding workers are joining now — add your trade today.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-navy px-6 pt-16 pb-10">
        <div className="max-w-[1080px] mx-auto">
          <div className="grid grid-cols-2 min-[480px]:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-7 md:gap-12 pb-12 border-b border-white/[0.07]">
            <div className="col-span-2 md:col-span-1">
              <div className="font-serif text-xl font-medium text-white mb-3">
                Tesilix<span className="italic font-light text-gold">.</span>
              </div>
              <p className="text-[13px] text-white/40 leading-[1.7] md:max-w-[240px]">
                The home for blue-collar workers in Kenya — built for the people
                who build the world.
              </p>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.1em] uppercase text-white/85 font-medium mb-4">
                Platform
              </div>
              <Link
                href="/browse"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                Find a worker
              </Link>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                Post a job
              </button>
              <Link
                href="/register"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                Join as a worker
              </Link>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                Pricing
              </button>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.1em] uppercase text-white/85 font-medium mb-4">
                Trades
              </div>
              <Link
                href="/browse"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                Plumbers
              </Link>
              <Link
                href="/browse"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                Electricians
              </Link>
              <Link
                href="/browse"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                Carpenters
              </Link>
              <Link
                href="/browse"
                className="block text-[13px] text-white/40 no-underline mb-2.5 transition-colors hover:text-white"
              >
                All categories
              </Link>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.1em] uppercase text-white/85 font-medium mb-4">
                Company
              </div>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                Blog
              </button>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                Careers
              </button>
              <button
                type="button"
                className="block text-[13px] text-white/40 mb-2.5 transition-colors hover:text-white bg-transparent border-none p-0 text-left cursor-pointer"
              >
                Contact
              </button>
            </div>
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
    </div>
  );
}
