"use client";

import { Home } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * The single gold "Back to home" button on the 404 page. Client-only because it
 * uses router.push; kept tiny so the not-found page itself stays a Server
 * Component.
 */
export default function HomeButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className="inline-flex items-center gap-2 bg-gold hover:bg-gold-dark text-navy px-5 py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-colors"
    >
      <Home size={15} strokeWidth={1.75} />
      Back to home
    </button>
  );
}
