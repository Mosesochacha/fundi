"use client";

import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The single gold "Back to home" button on the 404 page. Client-only because it
 * uses router.push; kept tiny so the not-found page itself stays a Server
 * Component.
 */
export default function HomeButton() {
  const router = useRouter();
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: hover ? "#a8872e" : "#c9a84c",
        color: "#0d1b2a",
        padding: "8px 20px",
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        border: "none",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      <Home size={15} strokeWidth={1.75} />
      Back to home
    </button>
  );
}
