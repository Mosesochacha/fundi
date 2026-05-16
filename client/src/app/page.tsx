import Link from "next/link";
import { Zap, ImageIcon, Share2, MapPin, Star } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "AI builds it",
    body: "Answer a few questions and AI writes your professional profile in under 2 minutes. No blank pages.",
  },
  {
    icon: ImageIcon,
    title: "Show your work",
    body: "Post photos of your best jobs. Let your work speak for you and build trust before the first call.",
  },
  {
    icon: Share2,
    title: "Share everywhere",
    body: "Get your own link. Share on WhatsApp, Facebook, or anywhere clients already are.",
  },
];

const PROFILES = [
  {
    name: "John Kamau",
    trade: "Plumber",
    location: "Nairobi, Kenya",
    jobs: 47,
    initials: "JK",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Grace Wanjiru",
    trade: "Electrician",
    location: "Westlands, Nairobi",
    jobs: 83,
    initials: "GW",
    color: "bg-orange-100 text-orange-700",
  },
  {
    name: "David Omondi",
    trade: "Carpenter",
    location: "Mombasa, Kenya",
    jobs: 31,
    initials: "DO",
    color: "bg-green-100 text-green-700",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-xl font-extrabold text-[#f97316] tracking-tight">Fundi</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-[#f97316] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-20 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 leading-tight tracking-tight">
          Get more clients.<br />
          Build your trade profile.
        </h1>
        <p className="mt-6 text-lg text-stone-500 leading-relaxed max-w-xl mx-auto">
          Fundi is the professional profile for skilled workers in Kenya.
          Built in under 2 minutes — our AI does the writing for you.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-[#f97316] text-white font-bold text-base px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Create my profile — it&apos;s free
          </Link>
          <Link
            href="/browse"
            className="w-full sm:w-auto text-stone-600 font-medium text-base px-8 py-3.5 rounded-xl border border-stone-200 hover:border-stone-300 transition-colors"
          >
            Browse tradespeople
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-stone-400">
          <span className="font-semibold text-stone-700">500+</span> skilled workers already on Fundi
        </p>
      </section>

      {/* Features */}
      <section className="bg-stone-50 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-12">
            Everything you need to get found online
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#f97316]" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-2">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example profiles */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 text-center mb-4">
          Real professionals, real profiles
        </h2>
        <p className="text-center text-stone-500 mb-12 text-sm">
          This is what your profile looks like to clients searching for your trade.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PROFILES.map((p) => (
            <div key={p.name} className="rounded-2xl border border-stone-100 shadow-sm p-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${p.color}`}>
                  {p.initials}
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                  <p className="text-xs text-[#f97316] font-medium">{p.trade}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <MapPin className="w-3 h-3" />
                {p.location}
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-stone-600 font-medium">{p.jobs} jobs completed</span>
              </div>
              <div className="mt-1 pt-3 border-t border-stone-100">
                <span className="text-xs bg-stone-50 text-stone-500 px-2 py-1 rounded-full">Available for hire</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#f97316] px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
          Ready to get more clients?
        </h2>
        <p className="text-orange-100 text-base mb-8 max-w-md mx-auto">
          Create your free profile in under 2 minutes. No CV required.
        </p>
        <Link
          href="/register"
          className="inline-block bg-white text-[#f97316] font-bold text-base px-8 py-3.5 rounded-xl hover:bg-orange-50 transition-colors"
        >
          Build my profile now
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-stone-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <span className="font-bold text-[#f97316] text-sm">Fundi</span>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-stone-600">About</Link>
            <Link href="/browse" className="hover:text-stone-600">Browse</Link>
            <a href="mailto:hello@fundi.app" className="hover:text-stone-600">Contact</a>
            <Link href="/privacy" className="hover:text-stone-600">Privacy</Link>
          </div>
          <span>© {new Date().getFullYear()} Fundi · Built for skilled workers</span>
        </div>
      </footer>

    </div>
  );
}
