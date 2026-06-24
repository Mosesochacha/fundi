import Link from "next/link";
import type { ReactNode } from "react";
import { btnGold } from "./landingStyles";

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

export default function WhyTesilix() {
  return (
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
  );
}
