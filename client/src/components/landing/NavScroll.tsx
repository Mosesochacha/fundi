"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NavScroll() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white h-16 transition-shadow duration-200${scrolled ? " border-b border-gray-100 shadow-sm" : ""}`}
    >
      <div className="max-w-[1100px] mx-auto px-6 h-full flex items-center justify-between">
        <Link
          href="/"
          className="font-playfair text-[22px] font-bold text-orange-500 no-underline"
        >
          Fundi
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <a
            href="#how-it-works"
            className="font-dm-sans text-sm text-gray-600 hover:text-orange-500 transition-colors no-underline"
          >
            How it works
          </a>
          <a
            href="#professionals"
            className="font-dm-sans text-sm text-gray-600 hover:text-orange-500 transition-colors no-underline"
          >
            For professionals
          </a>
          <a
            href="#community"
            className="font-dm-sans text-sm text-gray-600 hover:text-orange-500 transition-colors no-underline"
          >
            Community
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:flex items-center justify-center h-9 px-4 font-dm-sans text-sm font-medium text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors no-underline"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="flex items-center justify-center h-9 px-4 font-dm-sans text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors no-underline"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
