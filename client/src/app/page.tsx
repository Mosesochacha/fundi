import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LandingNav from "@/components/landing/LandingNav";
import LandingScripts from "@/components/landing/LandingScripts";
import { auth } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";
import "./landing.css";

export const metadata: Metadata = {
  title: "Hire Skilled Workers Near You",
  description:
    "Fundi connects you with verified, rated tradespeople — plumbers, electricians, carpenters and more — in minutes, not days.",
};

// ─── Data ────────────────────────────────────────────────────────────────────

const heroCards = [
  {
    initials: "JK",
    name: "James K.",
    trade: "Plumber · Nairobi",
    av: undefined as React.CSSProperties | undefined,
  },
  {
    initials: "MO",
    name: "Mary O.",
    trade: "Electrician · Lagos",
    av: { background: "#fff3e0", color: "#b45309" },
  },
  {
    initials: "AN",
    name: "Amir N.",
    trade: "Carpenter · Cairo",
    av: { background: "#ede9fe", color: "#5b21b6" },
  },
  {
    initials: "FN",
    name: "Fatima N.",
    trade: "Cleaner · Accra",
    av: { background: "#fce7f3", color: "#9d174d" },
  },
];

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

const reasons = [
  {
    num: "01",
    title: (
      <>
        Every worker is <em>verified</em>
      </>
    ),
    desc: "Phone-confirmed identity on every profile. No anonymous strangers, no fake accounts. You know exactly who is coming to your door.",
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    num: "02",
    title: (
      <>
        Reviews you can <em>actually trust</em>
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
        No brokers. <em>No cuts.</em>
      </>
    ),
    desc: "Agents take 20–40% and give you no guarantee. On Fundi you talk directly to the worker, agree your own price, and keep every shilling.",
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
        See work <em>before you hire</em>
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
    label: "Join the first cohort of workers shaping what Fundi becomes.",
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

const trustItems = [
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

const ctaAvatars = [
  {
    initials: "JK",
    style: { background: "var(--gold-light)", color: "var(--gold-dark)" },
  },
  { initials: "MO", style: { background: "#fff3e0", color: "#b45309" } },
  { initials: "AN", style: { background: "#ede9fe", color: "#5b21b6" } },
  { initials: "FN", style: { background: "#fce7f3", color: "#9d174d" } },
  { initials: "BM", style: { background: "#e0f2fe", color: "#0369a1" } },
];

const marqueeItems = [...professions, ...professions];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  // Signed-in users don't see the landing page — send them to their dashboard.
  const session = await auth();
  if (session?.user) {
    redirect(dashboardPathForRole(session.user.role));
  }

  return (
    <div className="lp">
      <LandingScripts />

      {/* NAV */}
      <LandingNav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <h1>
          Hire skilled workers.
          <br />
          <em>Anywhere.</em> Instantly.
        </h1>
        <p className="hero-sub">
          The new home for Kenya’s skilled tradespeople — plumbers,
          electricians, carpenters and more. Browse profiles and connect
          directly. No brokers.
        </p>
        <div className="hero-actions">
          <Link href="/browse" className="btn btn-gold btn-lg">
            Find a fundi near you
          </Link>
          <Link href="/register" className="btn btn-outline-navy btn-lg">
            Join as a worker →
          </Link>
        </div>
        <div className="hero-proof">
          <div style={{ textAlign: "center" }}>
            <div className="proof-num">Free</div>
            <div className="proof-label">For workers, always</div>
          </div>
          <div className="proof-div" />
          <div style={{ textAlign: "center" }}>
            <div className="proof-num">0%</div>
            <div className="proof-label">Broker commission</div>
          </div>
          <div className="proof-div" />
          <div style={{ textAlign: "center" }}>
            <div className="proof-num">Direct</div>
            <div className="proof-label">No middleman</div>
          </div>
          <div className="proof-div" />
          <div style={{ textAlign: "center" }}>
            <div className="proof-num">2 min</div>
            <div className="proof-label">To get listed</div>
          </div>
        </div>
        <div className="hero-card-row">
          {heroCards.map((c) => (
            <div className="hero-card" key={c.initials}>
              <div className="hc-av" style={c.av}>
                {c.initials}
              </div>
              <div>
                <div className="hc-name">
                  {c.name}{" "}
                  <span style={{ fontSize: 10, color: "var(--gold)" }}>✓</span>
                </div>
                <div className="hc-trade">{c.trade}</div>
                <div className="hc-stars">★★★★★</div>
              </div>
              <div className="verified-dot" />
            </div>
          ))}
        </div>
      </section>

      {/* TRUSTED-BY MARQUEE (reused) */}
      <div className="lp-marquee">
        <p className="lp-marquee-label">
          Trusted by professionals in every field
        </p>
        <div className="space-y-3">
          <div
            className="flex animate-marquee whitespace-nowrap"
            aria-hidden="true"
          >
            {marqueeItems.map((name, i) => (
              <span key={`a-${i}`} className="lp-marquee-item">
                {name}
                <span className="lp-marquee-dot">·</span>
              </span>
            ))}
          </div>
          <div
            className="flex animate-marquee-reverse whitespace-nowrap"
            aria-hidden="true"
          >
            {[...marqueeItems].reverse().map((name, i) => (
              <span key={`b-${i}`} className="lp-marquee-item">
                {name}
                <span className="lp-marquee-dot">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: "var(--cream2)" }}>
        <div className="container">
          <div className="eyebrow reveal">How it works</div>
          <h2 className="sec-title reveal">
            Three steps to
            <br />
            <em>a job done right</em>
          </h2>
          <div className="how-grid reveal">
            <div className="how-cell">
              <div className="how-num">01</div>
              <div className="how-icon">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <div className="how-title">Search your trade</div>
              <div className="how-desc">
                Tell us what you need — plumber, electrician, carpenter. Filter
                by location, rating, and availability. Find the right person in
                seconds.
              </div>
            </div>
            <div className="how-cell">
              <div className="how-num">02</div>
              <div className="how-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="how-title">Connect &amp; confirm</div>
              <div className="how-desc">
                Message directly, agree on price and time. No middlemen, no
                hidden fees. Every worker shows verified ratings from real past
                jobs.
              </div>
            </div>
            <div className="how-cell">
              <div className="how-num">03</div>
              <div className="how-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="how-title">Job done. Leave a review.</div>
              <div className="how-desc">
                Rate the worker after the job. Your review helps the next
                employer and rewards great workers with more opportunities.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY FUNDI */}
      <section id="why" className="why-section">
        <div className="bg-ring" style={{ width: 300, height: 300 }} />
        <div className="bg-ring" style={{ width: 500, height: 500 }} />
        <div className="bg-ring" style={{ width: 700, height: 700 }} />
        <div className="container" style={{ position: "relative" }}>
          <div className="eyebrow eyebrow-light reveal">Why Fundi</div>
          <h2 className="sec-title sec-title-light reveal">
            Stop guessing.
            <br />
            <em>Start hiring right.</em>
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: 420,
              marginTop: 16,
            }}
            className="reveal"
          >
            WhatsApp groups, brokers, and word of mouth leave you hoping for the
            best. Fundi gives you certainty.
          </p>
          <div className="reasons reveal">
            {reasons.map((r) => (
              <div className="reason" key={r.num}>
                <div className="reason-num">{r.num}</div>
                <div className="reason-title">{r.title}</div>
                <div className="reason-desc">{r.desc}</div>
                <div className="reason-icon">
                  <svg viewBox="0 0 24 24">{r.icon}</svg>
                </div>
              </div>
            ))}
          </div>
          <div className="bottom-strip reveal">
            <p className="strip-text">
              <strong>Still using WhatsApp groups?</strong> You deserve better
              than hoping someone replies.
            </p>
            <Link href="/browse" className="btn btn-gold btn-lg">
              Find a verified fundi →
            </Link>
          </div>
        </div>
      </section>

      {/* GLOBAL */}
      <section id="global" className="global-section">
        <div className="global-inner">
          <div className="reveal">
            <div className="eyebrow">Where we start</div>
            <h2 className="sec-title">
              Built for
              <br />
              <em>Kenya’s workers</em>
            </h2>
            <p className="sec-sub">
              Starting in Nairobi and built to scale across East Africa. Join
              early and grow with us from day one.
            </p>
            <div className="global-stats">
              {globalStats.map((s) => (
                <div className="global-stat" key={s.num}>
                  <div className="global-stat-num">{s.num}</div>
                  <div className="global-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="global-map reveal">
            <div className="map-grid-bg" />
            {mapDots.map((d, i) => (
              <div
                key={i}
                className={`map-dot${d.navy ? " navy" : ""}`}
                style={{ left: d.left, top: d.top }}
              />
            ))}
            <div
              style={{ position: "relative", textAlign: "center", zIndex: 2 }}
            >
              <div
                style={{
                  fontFamily: "var(--fr)",
                  fontSize: 32,
                  fontWeight: 400,
                  color: "var(--navy)",
                }}
              >
                Kenya
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink3)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                Launching 2026
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDING MEMBERS */}
      <section style={{ background: "var(--cream)" }}>
        <div className="container">
          <div className="eyebrow reveal">Founding members</div>
          <h2 className="sec-title reveal">
            Get in early.
            <br />
            <em>Grow with us.</em>
          </h2>
          <div className="testi-grid reveal">
            {foundingBenefits.map((b) => (
              <div className="testi-card" key={b.title}>
                <div className="founding-badge">
                  <span style={{ color: "var(--gold)" }}>★</span> Founding
                </div>
                <div className="founding-title">{b.title}</div>
                <p className="founding-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section id="trust" style={{ background: "var(--cream2)" }}>
        <div className="container">
          <div className="eyebrow reveal">Trust &amp; safety</div>
          <h2 className="sec-title reveal">
            We take trust
            <br />
            <em>seriously</em>
          </h2>
          <div className="trust-grid reveal">
            {trustItems.map((t) => (
              <div className="trust-item" key={t.title}>
                <div className="trust-icon">
                  <svg viewBox="0 0 24 24">{t.icon}</svg>
                </div>
                <div className="trust-title">{t.title}</div>
                <div className="trust-desc">{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-ring" style={{ width: 320, height: 320 }} />
        <div className="cta-ring" style={{ width: 520, height: 520 }} />
        <div className="cta-ring" style={{ width: 720, height: 720 }} />
        <div style={{ position: "relative" }}>
          <h2 className="cta-title reveal">
            Ready to find your
            <br />
            <em>next great fundi?</em>
          </h2>
          <p className="cta-sub reveal">
            Be one of the first fundis on the platform. Free to start, always —
            and free to stay.
          </p>
          <div className="cta-actions reveal">
            <Link href="/browse" className="btn btn-gold btn-lg">
              Find a fundi now
            </Link>
            <Link href="/register" className="btn btn-outline-navy btn-lg">
              Join as a worker →
            </Link>
          </div>
          <div className="cta-note reveal">
            Free forever for workers · No hidden fees · Cancel anytime
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 44,
            }}
            className="reveal"
          >
            <div className="proof-avatars">
              {ctaAvatars.map((a) => (
                <div className="pa" style={a.style} key={a.initials}>
                  {a.initials}
                </div>
              ))}
            </div>
            <div style={{ marginLeft: 14, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--ink2)" }}>
                Founding workers are joining now — add your trade today.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-logo">
                Fundi<span>.</span>
              </div>
              <p className="footer-desc">
                The home for blue-collar workers in Kenya — built for the people
                who build the world.
              </p>
              <div className="footer-flags">
                🇰🇪 Launching in Kenya · East Africa next
              </div>
            </div>
            <div>
              <div className="footer-col-title">Platform</div>
              <Link href="/browse" className="footer-link">
                Find a worker
              </Link>
              <a href="#" className="footer-link">
                Post a job
              </a>
              <Link href="/register" className="footer-link">
                Join as a worker
              </Link>
              <a href="#" className="footer-link">
                Pricing
              </a>
            </div>
            <div>
              <div className="footer-col-title">Trades</div>
              <Link href="/browse" className="footer-link">
                Plumbers
              </Link>
              <Link href="/browse" className="footer-link">
                Electricians
              </Link>
              <Link href="/browse" className="footer-link">
                Carpenters
              </Link>
              <Link href="/browse" className="footer-link">
                All categories
              </Link>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <a href="#" className="footer-link">
                About
              </a>
              <a href="#" className="footer-link">
                Blog
              </a>
              <a href="#" className="footer-link">
                Careers
              </a>
              <a href="#" className="footer-link">
                Contact
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 Fundi Technologies Ltd. All rights reserved.</div>
            <div className="footer-legal">
              <a href="#" className="footer-link" style={{ margin: 0 }}>
                Privacy
              </a>
              <a href="#" className="footer-link" style={{ margin: 0 }}>
                Terms
              </a>
              <a href="#" className="footer-link" style={{ margin: 0 }}>
                Safety
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
