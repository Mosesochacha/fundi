import Link from "next/link";
import NavScroll from "@/components/landing/NavScroll";

// ─── SVG icons (inline, no external library) ───────────────────────────────

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 9l3.5 3.5L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
      <path d="M5.5 0C3.015 0 1 2.015 1 4.5c0 3.281 4.5 8.5 4.5 8.5s4.5-5.219 4.5-8.5C10 2.015 7.985 0 5.5 0zm0 6.125a1.625 1.625 0 1 1 0-3.25 1.625 1.625 0 0 1 0 3.25z" fill="currentColor" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2L3 5.5v5C3 14.25 6.1 17.82 10 18.5c3.9-.68 7-4.25 7-8V5.5L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2L4 11h7l-2 7 9-10h-7l2-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="3" y="9" width="26" height="17" rx="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="17" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9l2-4h4l2 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="11" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="11" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M2 27c0-5 4-8 10-8s10 3 10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 19c4 0 8 2.5 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M5 5h22a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H10l-7 5V7a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────

const professions = [
  "Architects", "Photographers", "Lawyers", "Electricians", "Designers",
  "Consultants", "Plumbers", "Engineers", "Therapists", "Accountants",
  "Carpenters", "Developers", "Teachers", "Nurses", "Chefs", "Stylists",
];

const cities = [
  { flag: "🇬🇧", name: "London" },
  { flag: "🇳🇬", name: "Lagos" },
  { flag: "🇵🇭", name: "Manila" },
  { flag: "🇧🇷", name: "São Paulo" },
  { flag: "🇮🇳", name: "Mumbai" },
  { flag: "🇿🇦", name: "Cape Town" },
  { flag: "🇦🇺", name: "Sydney" },
  { flag: "🇨🇦", name: "Toronto" },
  { flag: "🇩🇪", name: "Berlin" },
  { flag: "🇫🇷", name: "Paris" },
  { flag: "🇰🇪", name: "Nairobi" },
  { flag: "🇲🇽", name: "Mexico City" },
  { flag: "🇦🇪", name: "Dubai" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇯🇵", name: "Tokyo" },
  { flag: "🇪🇬", name: "Cairo" },
  { flag: "🇬🇭", name: "Accra" },
  { flag: "🇵🇰", name: "Karachi" },
  { flag: "🇦🇷", name: "Buenos Aires" },
  { flag: "🇺🇸", name: "New York" },
];

const testimonials = [
  {
    quote: "I had no website and no way to show clients my past work. Now I share one link and they can see everything. My bookings doubled in the first month.",
    initials: "MO",
    name: "Marcus O.",
    role: "Master Plumber",
    city: "Lagos, Nigeria",
  },
  {
    quote: "As a freelance designer I tried everything — Behance, LinkedIn, a personal site. Fundi is the only thing that actually gets me new clients consistently.",
    initials: "PS",
    name: "Priya S.",
    role: "Brand Designer",
    city: "Mumbai, India",
  },
  {
    quote: "My clients used to find me through word of mouth only. Now I get enquiries from people I have never met who found me through search. It changed my business completely.",
    initials: "ER",
    name: "Elena R.",
    role: "Interior Architect",
    city: "São Paulo, Brazil",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const marqueeItems = [...professions, ...professions];

  return (
    <div className="font-dm-sans bg-cream">
      <NavScroll />

      <main>
        {/* ── SECTION 2: HERO ─────────────────────────────────────────── */}
        <section
          id="hero"
          aria-label="Hero"
          className="min-h-[90vh] bg-cream flex items-center justify-center px-6 py-14 md:py-20"
        >
          <div className="max-w-[860px] mx-auto text-center w-full">
            {/* Pill label */}
            <div className="inline-flex items-center px-[14px] py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full font-dm-sans text-xs font-medium tracking-[0.04em] mb-8">
              The professional identity platform
            </div>

            {/* Headline */}
            <h1 className="font-playfair text-[72px] max-md:text-[42px] leading-[1.1] text-brand-dark font-bold mb-6">
              Show your work.<br />
              <span className="text-orange-500">Grow your reputation.</span>
            </h1>

            {/* Sub-headline */}
            <p className="font-dm-sans text-xl max-md:text-base text-gray-500 max-w-[580px] mx-auto leading-relaxed mb-10">
              Create your professional profile in minutes. Join a global community
              of skilled professionals. Get discovered by clients worldwide.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center h-[52px] px-7 font-dm-sans text-[15px] font-semibold text-white bg-orange-500 rounded-[10px] hover:bg-orange-600 transition-colors no-underline"
              >
                Create your free profile
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex w-full sm:w-auto items-center justify-center h-[52px] px-7 font-dm-sans text-[15px] font-semibold text-orange-500 bg-white border-[1.5px] border-orange-500 rounded-[10px] hover:bg-orange-50 transition-colors no-underline"
              >
                See how it works
              </a>
            </div>

            {/* Fine print */}
            <p className="font-dm-sans text-[13px] text-gray-400 mb-16">
              Free forever · No credit card required · Setup in under 5 minutes
            </p>

            {/* Stats bar */}
            <div className="border-t border-b border-gray-200 py-5">
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="text-center py-3 px-2">
                  <p className="font-playfair text-[26px] md:text-[32px] font-bold text-brand-dark leading-none mb-1">10,000+</p>
                  <p className="font-dm-sans text-[12px] md:text-[13px] text-gray-400">Professionals</p>
                </div>
                <div className="text-center py-3 px-2 border-l border-gray-200">
                  <p className="font-playfair text-[26px] md:text-[32px] font-bold text-brand-dark leading-none mb-1">120+</p>
                  <p className="font-dm-sans text-[12px] md:text-[13px] text-gray-400">Countries</p>
                </div>
                <div className="text-center py-3 px-2 border-t md:border-t-0 border-l md:border-l border-gray-200">
                  <p className="font-playfair text-[26px] md:text-[32px] font-bold text-brand-dark leading-none mb-1">4.8★</p>
                  <p className="font-dm-sans text-[12px] md:text-[13px] text-gray-400">Avg. rating</p>
                </div>
                <div className="text-center py-3 px-2 border-t md:border-t-0 border-l border-gray-200">
                  <p className="font-playfair text-[26px] md:text-[32px] font-bold text-brand-dark leading-none mb-1">2 min</p>
                  <p className="font-dm-sans text-[12px] md:text-[13px] text-gray-400">To go live</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: SOCIAL PROOF LOGOS ───────────────────────────── */}
        <section aria-label="Trusted by professionals in every field" className="bg-white py-12 overflow-hidden">
          <p className="font-dm-sans text-xs text-gray-400 uppercase tracking-[0.08em] text-center mb-6">
            Trusted by professionals in every field
          </p>

          <div className="marquee-wrapper space-y-3">
            {/* Row 1 — scrolls left */}
            <div className="flex animate-marquee whitespace-nowrap" aria-hidden="true">
              {marqueeItems.map((name, i) => (
                <span key={i} className="font-dm-sans text-[15px] font-medium text-gray-300 flex-shrink-0 mx-4">
                  {name} <span className="text-orange-300 ml-4">·</span>
                </span>
              ))}
            </div>

            {/* Row 2 — scrolls right */}
            <div className="flex animate-marquee-reverse whitespace-nowrap" aria-hidden="true">
              {[...marqueeItems].reverse().map((name, i) => (
                <span key={i} className="font-dm-sans text-[15px] font-medium text-gray-300 flex-shrink-0 mx-4">
                  {name} <span className="text-orange-300 ml-4">·</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: HOW IT WORKS ─────────────────────────────────── */}
        <section id="how-it-works" aria-label="How it works" className="bg-cream py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto">
            <p className="font-dm-sans text-xs text-orange-500 uppercase tracking-[0.08em] mb-4">
              Simple by design
            </p>
            <h2 className="font-playfair text-[48px] max-md:text-[34px] font-bold text-brand-dark leading-[1.15] max-w-[560px] mb-4">
              Your professional profile,<br />built in three steps.
            </h2>
            <p className="font-dm-sans text-[17px] text-gray-500 max-w-[480px] leading-relaxed mb-8 md:mb-14">
              No designers. No developers. No website builders.<br />
              Just answer a few questions and go live.
            </p>

            <div className="relative">
              {/* Connecting dashed line — desktop only */}
              <div className="hidden md:block absolute top-[56px] left-[35%] right-[35%] border-t-2 border-dashed border-orange-200 pointer-events-none" />

              <div className="grid md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="relative bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-10">
                  <p className="font-playfair text-[48px] font-bold text-orange-100 leading-none mb-5">01</p>
                  <h3 className="font-dm-sans text-lg font-semibold text-brand-dark mb-3">Tell us about yourself</h3>
                  <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed mb-5">
                    Answer three simple questions about your profession, location, and what makes you stand out. Takes under two minutes.
                  </p>
                  <span className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                    AI-powered
                  </span>
                </div>

                {/* Step 2 */}
                <div className="relative bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-10">
                  <p className="font-playfair text-[48px] font-bold text-orange-100 leading-none mb-5">02</p>
                  <h3 className="font-dm-sans text-lg font-semibold text-brand-dark mb-3">Your profile goes live</h3>
                  <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed mb-5">
                    Our AI writes your bio, tagline, and service list instantly. Your profile is live and shareable the moment you publish.
                  </p>
                  <span className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                    Instant
                  </span>
                </div>

                {/* Step 3 */}
                <div className="relative bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-10">
                  <p className="font-playfair text-[48px] font-bold text-orange-100 leading-none mb-5">03</p>
                  <h3 className="font-dm-sans text-lg font-semibold text-brand-dark mb-3">Clients find you</h3>
                  <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed mb-5">
                    Share your profile link anywhere. Get discovered through our global search. Build your reputation through community posts and reviews.
                  </p>
                  <span className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full">
                    Global reach
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FOR PROFESSIONALS ────────────────────────────── */}
        <section id="professionals" aria-label="For professionals" className="bg-brand-dark py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Left — text */}
              <div>
                <p className="font-dm-sans text-xs text-orange-300 uppercase tracking-[0.08em] mb-4">
                  For professionals
                </p>
                <h2 className="font-playfair text-[48px] max-md:text-[34px] font-bold text-white leading-[1.15] mb-6">
                  Everything you need.<br />Nothing you don&apos;t.
                </h2>
                <p className="font-dm-sans text-[17px] text-orange-200 leading-relaxed max-w-[420px] mb-8 md:mb-10">
                  Your Fundi profile is your professional home on the internet.
                  Share it everywhere. Update it anytime. Let your work speak.
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    "AI-generated bio from your answers",
                    "Portfolio gallery for your work photos",
                    "Searchable by clients worldwide",
                    "Community feed to showcase your projects",
                    "One shareable link for all your channels",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 font-dm-sans text-[15px] text-white">
                      <span className="text-orange-400 flex-shrink-0">
                        <IconCheck />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className="font-dm-sans text-[15px] font-semibold text-orange-300 hover:text-orange-200 transition-colors no-underline"
                >
                  Start building your profile →
                </Link>
              </div>

              {/* Right — profile card mockup */}
              <div className="flex justify-center md:justify-end">
                <div className="relative bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                  {/* Verified badge */}
                  <div className="absolute top-3 right-3 bg-white text-green-600 border border-green-100 text-[11px] font-medium px-[10px] py-[3px] rounded-full shadow-sm font-dm-sans">
                    ✓ Verified
                  </div>

                  {/* Avatar + identity */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-white font-dm-sans font-semibold text-lg flex-shrink-0">
                      JK
                    </div>
                    <div>
                      <p className="font-dm-sans text-base font-semibold text-gray-900">James K.</p>
                      <p className="font-dm-sans text-sm text-orange-500">Master Electrician</p>
                      <p className="font-dm-sans text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <span className="text-gray-300"><IconPin /></span>
                        London, UK
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 mb-4" />

                  {/* Bio */}
                  <p className="font-dm-sans text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-4">
                    10+ years specialising in residential and commercial electrical installations. Certified and fully insured.
                  </p>

                  {/* Service tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Wiring", "Fault Finding", "Solar"].map((tag) => (
                      <span key={tag} className="font-dm-sans text-xs bg-orange-50 text-orange-700 rounded-full px-[10px] py-1">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 h-10 bg-orange-500 text-white font-dm-sans text-[13px] font-medium rounded-lg hover:bg-orange-600 transition-colors cursor-default">
                      Call
                    </button>
                    <button className="flex-1 h-10 bg-orange-500 text-white font-dm-sans text-[13px] font-medium rounded-lg hover:bg-orange-600 transition-colors cursor-default">
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: FOR CLIENTS ──────────────────────────────────── */}
        <section aria-label="For clients" className="bg-white py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Left — search mockup */}
              <div className="flex justify-center md:justify-start">
                <div className="w-full max-w-[400px] bg-white border border-gray-200 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
                  {/* Search bar */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <span className="text-gray-400 flex-shrink-0"><IconSearch /></span>
                    <span className="font-dm-sans text-sm text-gray-400">Find a plumber near me</span>
                  </div>

                  {/* Results */}
                  {[
                    { initials: "AK", bg: "bg-orange-500", name: "Amara K.", role: "Plumber", city: "London", rating: 48 },
                    { initials: "JM", bg: "bg-orange-500", name: "Joel M.", role: "Plumber", city: "Manchester", rating: 31 },
                    { initials: "SP", bg: "bg-orange-700", name: "Sara P.", role: "Plumber", city: "Birmingham", rating: 56 },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className={`w-9 h-9 rounded-full ${r.bg} flex items-center justify-center text-white font-dm-sans text-xs font-semibold flex-shrink-0`}>
                        {r.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-dm-sans text-sm font-semibold text-gray-900">{r.name}</p>
                        <p className="font-dm-sans text-xs text-gray-400">{r.role} · {r.city}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-amber-400 text-xs leading-none">★★★★★</p>
                        <p className="font-dm-sans text-[11px] text-gray-400">({r.rating})</p>
                      </div>
                      <span className="font-dm-sans text-xs text-orange-500 font-medium flex-shrink-0">
                        View
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — text */}
              <div>
                <p className="font-dm-sans text-xs text-orange-500 uppercase tracking-[0.08em] mb-4">
                  For clients
                </p>
                <h2 className="font-playfair text-[48px] max-md:text-[34px] font-bold text-brand-dark leading-[1.15] mb-6">
                  Find trusted professionals<br />anywhere in the world.
                </h2>
                <p className="font-dm-sans text-[17px] text-gray-500 leading-relaxed mb-10">
                  Search thousands of verified professionals by skill and location.
                  See their real work, read reviews, and connect instantly.
                </p>

                <div className="space-y-7">
                  {[
                    {
                      icon: <IconSearch />,
                      title: "Search by skill and location",
                      desc: "Find exactly who you need with powerful filters and instant results.",
                    },
                    {
                      icon: <IconShield />,
                      title: "Verified profiles only",
                      desc: "Every professional is real. See their work portfolio and client reviews.",
                    },
                    {
                      icon: <IconBolt />,
                      title: "Connect in seconds",
                      desc: "Message, call, or WhatsApp directly from their profile. No middleman.",
                    },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                        {icon}
                      </div>
                      <div>
                        <p className="font-dm-sans text-base font-semibold text-brand-dark mb-1">{title}</p>
                        <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 7: COMMUNITY ────────────────────────────────────── */}
        <section id="community" aria-label="Community" className="bg-cream py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-8 md:mb-14">
              <p className="font-dm-sans text-xs text-orange-500 uppercase tracking-[0.08em] mb-4">
                Built for connection
              </p>
              <h2 className="font-playfair text-[48px] max-md:text-[34px] font-bold text-brand-dark leading-[1.15] mb-5">
                A global community of<br />skilled professionals.
              </h2>
              <p className="font-dm-sans text-[17px] text-gray-500 max-w-[560px] mx-auto leading-relaxed">
                Share your latest projects. Learn from others. Build your reputation
                through a feed that puts your work front and centre.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <IconCamera />,
                  title: "Post your work",
                  desc: "Share photos of completed projects, behind-the-scenes moments, and professional tips with your followers.",
                },
                {
                  icon: <IconUsers />,
                  title: "Build your following",
                  desc: "Grow an audience of clients and peers who follow your work and recommend you to others.",
                },
                {
                  icon: <IconChat />,
                  title: "Learn and connect",
                  desc: "Ask questions, share knowledge, and connect with professionals in your field from around the world.",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="text-orange-500 mb-5">{icon}</div>
                  <h3 className="font-dm-sans text-lg font-semibold text-brand-dark mb-3">{title}</h3>
                  <p className="font-dm-sans text-[15px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: GLOBAL REACH ─────────────────────────────────── */}
        <section aria-label="Global reach" className="bg-white py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto text-center">
            <h2 className="font-playfair text-[52px] max-md:text-[36px] font-bold text-brand-dark leading-[1.1] mb-5">
              From Lagos to London.<br />
              <span className="text-orange-500">Manila to São Paulo.</span>
            </h2>
            <p className="font-dm-sans text-lg text-gray-500 max-w-[560px] mx-auto leading-relaxed mb-12">
              Fundi works for every skill, in every city, in every country.
              Your profile is your global professional passport.
            </p>

            <div className="flex flex-wrap justify-center gap-[10px] mb-12">
              {cities.map(({ flag, name }) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-4 py-2 font-dm-sans text-[13px] text-gray-600"
                >
                  {flag} {name}
                </span>
              ))}
            </div>

            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto items-center justify-center h-14 px-10 font-dm-sans text-base font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors no-underline"
            >
              Join professionals in 120+ countries →
            </Link>
          </div>
        </section>

        {/* ── SECTION 9: TESTIMONIALS ─────────────────────────────────── */}
        <section aria-label="Testimonials" className="bg-brand-dark py-14 md:py-24 px-6">
          <div className="max-w-[1100px] mx-auto">
            <div className="text-center mb-8 md:mb-14">
              <p className="font-dm-sans text-xs text-orange-300 uppercase tracking-[0.08em] mb-4">
                What professionals say
              </p>
              <h2 className="font-playfair text-[44px] max-md:text-[32px] font-bold text-white leading-[1.15]">
                Real people. Real results.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map(({ quote, initials, name, role, city }) => (
                <div
                  key={name}
                  className="bg-white/[0.06] border border-white/10 rounded-2xl p-8"
                >
                  <p className="font-playfair text-[64px] leading-[0.8] text-orange-700 mb-4 select-none">&ldquo;</p>
                  <p className="font-dm-sans text-base text-white leading-[1.7] italic mb-6">{quote}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center text-white font-dm-sans font-semibold text-base flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-dm-sans text-[15px] font-semibold text-white">{name}</p>
                      <p className="font-dm-sans text-[13px] text-orange-300">{role} · {city}</p>
                    </div>
                  </div>
                  <p className="text-amber-400 text-sm mt-4">★★★★★</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 10: FINAL CTA ────────────────────────────────────── */}
        <section aria-label="Get started" className="bg-cream py-16 md:py-[120px] px-6">
          <div className="max-w-[860px] mx-auto text-center">
            <h2 className="font-playfair text-[64px] max-md:text-[42px] font-bold text-brand-dark leading-[1.1] mb-6">
              Your work deserves<br />
              <span className="text-orange-500">to be seen.</span>
            </h2>
            <p className="font-dm-sans text-lg text-gray-500 max-w-[560px] mx-auto leading-relaxed mb-10">
              Join thousands of professionals who are building their reputation,
              finding new clients, and growing their career on Fundi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
              <Link
                href="/register"
                className="inline-flex w-full sm:w-auto items-center justify-center h-14 px-9 font-dm-sans text-base font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors no-underline"
              >
                Create your free profile
              </Link>
              <Link
                href="/browse"
                className="inline-flex w-full sm:w-auto items-center justify-center h-14 px-9 font-dm-sans text-base font-semibold text-orange-500 bg-white border-[1.5px] border-orange-500 rounded-xl hover:bg-orange-50 transition-colors no-underline"
              >
                Browse professionals
              </Link>
            </div>

            <p className="font-dm-sans text-[13px] text-gray-400">
              Free forever · No credit card · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* ── SECTION 11: FOOTER ──────────────────────────────────────── */}
      <footer aria-label="Site footer" className="bg-brand-dark pt-12 md:pt-16 pb-8 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-10 md:mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1 pb-2 md:pb-0 border-b border-white/10 md:border-0">
              <p className="font-playfair text-[22px] font-bold text-white mb-2">Fundi</p>
              <p className="font-dm-sans text-sm text-white/60 leading-relaxed">
                The professional identity platform.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="font-dm-sans text-[13px] text-white/50 uppercase tracking-[0.08em] mb-4">Platform</p>
              <ul className="space-y-2">
                {[
                  { label: "How it works", href: "#how-it-works" },
                  { label: "Browse professionals", href: "/browse" },
                  { label: "Community", href: "#community" },
                  { label: "Pricing", href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="font-dm-sans text-sm text-white/75 hover:text-white transition-colors no-underline leading-loose">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="font-dm-sans text-[13px] text-white/50 uppercase tracking-[0.08em] mb-4">Company</p>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Press"].map((link) => (
                  <li key={link}>
                    <a href="#" className="font-dm-sans text-sm text-white/75 hover:text-white transition-colors no-underline leading-loose">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="font-dm-sans text-[13px] text-white/50 uppercase tracking-[0.08em] mb-4">Legal</p>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
                  <li key={link}>
                    <a href="#" className="font-dm-sans text-sm text-white/75 hover:text-white transition-colors no-underline leading-loose">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-dm-sans text-[13px] text-white/50">
              &copy; 2026 Fundi. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {["Twitter", "LinkedIn", "Instagram"].map((platform, i) => (
                <span key={platform} className="flex items-center gap-4">
                  {i > 0 && <span className="text-white/20 -ml-2">·</span>}
                  <a href="#" className="font-dm-sans text-[13px] text-white/50 hover:text-white/80 transition-colors no-underline">
                    {platform}
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
