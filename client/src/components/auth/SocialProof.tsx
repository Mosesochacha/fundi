"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const testimonials = [
  {
    name: "John Kamau",
    profession: "Master Plumber, Nairobi",
    quote: "I got 3 new clients in my first week just from my profile.",
    initials: "JK",
    avatarBg: "#c2410c",
  },
  {
    name: "Grace Wanjiku",
    profession: "Interior Painter, Kilimani",
    quote: "Customers see my work before they even call me. Game changer.",
    initials: "GW",
    avatarBg: "#E05A2B",
  },
  {
    name: "David Ochieng",
    profession: "Carpenter, South B",
    quote: "Finally a platform that shows what I can actually do.",
    initials: "DO",
    avatarBg: "#fdba74",
  },
] as const;

export default function SocialProof() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[idx];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-10 overflow-hidden">
      {/* Fundi logo */}
      <p className="relative z-10 text-white text-2xl font-bold font-playfair">Fundi</p>

      {/* Main content */}
      <div className="relative z-10 space-y-8">
        <p className="text-white text-4xl font-playfair italic leading-tight">
          Your craft deserves<br />to be seen.
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
            <p className="text-white/90 text-[15px] leading-relaxed font-dm-sans italic">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: t.avatarBg }}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold font-dm-sans">{t.name}</p>
                <p className="text-white/60 text-xs font-dm-sans">{t.profession}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === idx ? "white" : "rgba(255,255,255,0.3)" }}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p
        className="relative z-10 text-sm font-dm-sans"
        style={{ color: "var(--orange-100)" }}
      >
        Join 2,400+ professionals building their reputation on Fundi
      </p>
    </div>
  );
}
