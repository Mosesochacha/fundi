"use client";

import { useEffect } from "react";

/**
 * Drives every below-the-fold landing animation from one IntersectionObserver.
 *
 * Sections stay server components: they only mark elements with `data-rise`,
 * `data-draw` or `data-grow` (and an optional `--d` stagger delay). The hidden
 * start states live behind `html[data-motion="on"]`, which is set here on
 * mount — so if this bundle never loads, the page renders fully visible rather
 * than blank. Elements are unobserved once they play; nothing re-animates on
 * scroll-back, which is what makes the page feel authored rather than twitchy.
 *
 * The hero deliberately opts out and uses the CSS-only `.reveal` load
 * animation instead, so above-the-fold content never waits on hydration.
 */
export default function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-rise], [data-draw], [data-grow]",
      ),
    );
    if (targets.length === 0) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    root.setAttribute("data-motion", "on");

    if (reduced || typeof IntersectionObserver === "undefined") {
      for (const el of targets) el.classList.add("is-in");
      return () => root.removeAttribute("data-motion");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      // Fire a little before the element is fully on screen so the motion
      // reads as the section "settling" rather than reacting to the scroll.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    for (const el of targets) observer.observe(el);

    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
    };
  }, []);

  return null;
}
