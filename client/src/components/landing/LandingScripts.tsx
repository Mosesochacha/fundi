"use client";

import { useEffect } from "react";

/**
 * Reveals `.reveal` blocks as they enter the viewport.
 * (The nav's scrolled-border state is owned by <LandingNav> itself.)
 */
export default function LandingScripts() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".lp .reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
