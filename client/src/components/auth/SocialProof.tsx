"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "John Kamau",
    profession: "Master Plumber, Nairobi",
    quote: "I got 3 new clients in my first week just from my profile.",
    initials: "JK",
    avatarBg: "var(--color-gold-dark)",
  },
  {
    name: "Grace Wanjiku",
    profession: "Interior Painter, Kilimani",
    quote: "Customers see my work before they even call me. Game changer.",
    initials: "GW",
    avatarBg: "var(--color-gold)",
  },
  {
    name: "David Ochieng",
    profession: "Carpenter, South B",
    quote: "Finally a platform that shows what I can actually do.",
    initials: "DO",
    avatarBg: "var(--color-gold-light)",
  },
] as const;

export default function SocialProof() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIdx((i) => (i + 1) % testimonials.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[idx];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-10 overflow-hidden">
      {/* Tesilix logo */}
      <p className="relative z-10 text-white text-2xl font-medium font-serif">
        Tesilix<span className="italic text-gold font-light">.</span>
      </p>

      {/* Main content */}
      <div className="relative z-10 space-y-8">
        <p className="text-white text-4xl font-serif italic leading-tight">
          Your craft deserves
          <br />
          to be seen.
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/10 rounded-2xl p-6 space-y-4 backdrop-blur-sm"
          >
            <p className="text-white/90 text-[15px] leading-relaxed italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-navy text-sm font-bold flex-shrink-0"
                style={{ background: t.avatarBg }}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-white/60 text-xs">{t.profession}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {testimonials.map((item, i) => (
            <button
              type="button"
              key={item.name}
              onClick={() => setIdx(i)}
              className={
                i === idx
                  ? "w-2 h-2 rounded-full transition-all duration-300 bg-white"
                  : "w-2 h-2 rounded-full transition-all duration-300 bg-white/30"
              }
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 text-sm text-gold-light">
        Join 2,400+ professionals building their reputation on Tesilix
      </p>
    </div>
  );
}
