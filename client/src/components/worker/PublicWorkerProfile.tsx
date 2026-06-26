import { Briefcase, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import type { PublicWorkerData } from "@/lib/publicProfile";
import { tradeSlug } from "@/lib/seo";

/**
 * Public, SEO-facing worker profile shown to logged-out visitors and crawlers.
 * Server-rendered (no hooks) so the content is in the initial HTML. Signed-in
 * viewers get the richer interactive profile via WorkerProfileGate instead.
 */
export default function PublicWorkerProfile({
  data,
}: {
  data: PublicWorkerData;
}) {
  const firstName = data.name?.trim().split(/\s+/)[0] || "this worker";
  const hasRate = data.dailyRate > 0;
  const loginHref = `/login?next=${encodeURIComponent(`/worker/${data.username}`)}`;

  return (
    <div className="min-h-screen bg-cream text-ink font-sans">
      <LandingNav />

      <main className="mx-auto max-w-[860px] px-5 pb-24 pt-[96px] md:pt-[120px]">
        <section className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {data.avatarUrl ? (
              // biome-ignore lint/performance/noImgElement: avatar is a remote, variable host — plain img keeps this view server-renderable
              <img
                src={data.avatarUrl}
                alt={data.name}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-navy text-2xl font-semibold text-white">
                {data.initials}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="font-serif text-[28px] font-medium leading-tight text-ink md:text-[34px]">
                {data.name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-2">
                <span className="font-semibold text-gold-dark">
                  {data.trade}
                </span>
                {data.location && (
                  <span className="inline-flex items-center gap-1 text-ink-3">
                    <MapPin size={15} aria-hidden /> {data.location}
                  </span>
                )}
                {data.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[#3C7E97]">
                    <ShieldCheck size={15} aria-hidden /> Verified
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-sm font-medium">
                <span
                  className={data.isAvailable ? "text-[#4F7A48]" : "text-ink-4"}
                >
                  ● {data.isAvailable ? "Available for hire" : "Not available"}
                </span>
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
            <Stat
              icon={<Star size={16} aria-hidden />}
              label="Rating"
              value={
                data.reviewCount > 0
                  ? `${data.rating.toFixed(1)} (${data.reviewCount})`
                  : "New"
              }
            />
            <Stat
              icon={<Briefcase size={16} aria-hidden />}
              label="Jobs done"
              value={String(data.jobsDone)}
            />
            <Stat
              label="Experience"
              value={
                data.yearsExperience > 0
                  ? `${data.yearsExperience} yr${data.yearsExperience === 1 ? "" : "s"}`
                  : "—"
              }
            />
            <Stat
              label="Day rate"
              value={
                hasRate
                  ? `${data.currencySymbol} ${data.dailyRate.toLocaleString()}`
                  : "On request"
              }
            />
          </dl>
        </section>

        {data.about && (
          <section className="mt-5 rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 className="font-serif text-lg font-medium text-ink">About</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
              {data.about}
            </p>
          </section>
        )}

        {data.services.length > 0 && (
          <section className="mt-5 rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 className="font-serif text-lg font-medium text-ink">
              Services
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.services.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border bg-cream px-3 py-1.5 text-sm text-ink-2"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-5 rounded-2xl border border-gold-dark/30 bg-white p-6 text-center md:p-8">
          <h2 className="font-serif text-xl font-medium text-ink">
            Want to hire {firstName}?
          </h2>
          <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-ink-2">
            Sign in to message {firstName}, view their full portfolio and send a
            hire request.
          </p>
          <Link
            href={loginHref}
            className="mt-4 inline-block rounded-full bg-gold-dark px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold"
          >
            Sign in to contact
          </Link>
          <p className="mt-4 text-sm text-ink-3">
            Looking for more?{" "}
            <Link
              href={`/browse/${tradeSlug(data.trade)}`}
              className="font-semibold text-gold-dark hover:underline"
            >
              Browse {data.trade}s
            </Link>
          </p>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-3">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-ink">{value}</dd>
    </div>
  );
}
