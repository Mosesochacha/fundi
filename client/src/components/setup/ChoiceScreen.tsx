"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { Sparkles, PenLine } from "lucide-react";

export default function ChoiceScreen() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="font-playfair text-2xl font-bold" style={{ color: "#f97316" }}>Fundi</span>
      </div>

      <h1 className="font-playfair text-3xl md:text-4xl font-bold text-gray-900 text-center mb-2">
        Let&apos;s build your profile
      </h1>
      <p className="text-gray-500 text-center mb-10">How would you like to get started?</p>

      <div className="flex flex-col md:flex-row gap-5 w-full max-w-2xl">
        {/* Card A — AI */}
        <div className="flex-1 relative border-2 rounded-2xl p-7 flex flex-col" style={{ borderColor: "#f97316" }}>
          <span
            className="absolute -top-3 left-6 px-3 py-0.5 text-xs font-semibold text-white rounded-full"
            style={{ backgroundColor: "#f97316" }}
          >
            Recommended
          </span>
          <Sparkles size={48} className="mb-4" style={{ color: "#f97316" }} />
          <h2 className="font-playfair text-xl font-bold text-gray-900 mb-2">Ask AI to build it</h2>
          <p className="text-sm text-gray-500 flex-1 mb-4">
            Answer 3 quick questions. Our AI writes your bio, tagline and services in seconds. Edit anything you want to change.
          </p>
          <p className="text-sm font-semibold mb-5" style={{ color: "#f97316" }}>⚡ Under 2 minutes</p>
          <Link
            href="/setup/ai"
            onClick={() => posthog.capture("setup_path_chosen", { path: "ai" })}
            className="w-full flex items-center justify-center rounded-xl text-white font-semibold text-base h-[52px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#f97316" }}
          >
            Get started with AI →
          </Link>
        </div>

        {/* Card B — Manual */}
        <div className="flex-1 border rounded-2xl p-7 flex flex-col" style={{ borderColor: "#e5e7eb" }}>
          <PenLine size={48} className="mb-4 text-gray-600" />
          <h2 className="font-playfair text-xl font-bold text-gray-900 mb-2">Set up manually</h2>
          <p className="text-sm text-gray-500 flex-1 mb-4">
            Fill in your details step by step. Full control over every word from the start.
          </p>
          <p className="text-sm text-gray-500 mb-5">🕐 5 to 10 minutes</p>
          <Link
            href="/setup/manual"
            onClick={() => posthog.capture("setup_path_chosen", { path: "manual" })}
            className="w-full flex items-center justify-center rounded-xl font-semibold text-base h-[52px] border border-gray-300 text-gray-900 bg-white transition-colors hover:bg-gray-50"
          >
            Set up manually →
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center">
        You can always edit everything later from your dashboard
      </p>
    </div>
  );
}
