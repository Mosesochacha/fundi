"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Navy welcome toast shown once after onboarding (?welcome=true). Auto-dismisses
 * after 6s, dismiss on click, and strips ?welcome=true from the URL so a refresh
 * doesn't re-show it.
 */
export default function WelcomeToast({
  role,
  firstName,
}: {
  role: "worker" | "employer";
  firstName: string;
}) {
  const [show, setShow] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") !== "true") return;
    ran.current = true;
    setShow(true);
    params.delete("welcome");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : ""),
    );
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  const sub =
    role === "employer"
      ? "Find your first fundi and get the job done"
      : "Complete your profile to start receiving job requests";

  return (
    <button
      type="button"
      onClick={() => setShow(false)}
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 12,
        maxWidth: 460,
        width: "calc(100% - 32px)",
        textAlign: "left",
        background: "#0d1b2a",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "12px 16px",
        boxShadow: "0 8px 24px -6px rgba(0,0,0,0.4)",
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "#c9a84c",
          color: "#0d1b2a",
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircleCheck size={17} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          Welcome to Fundi, {firstName}! 🎉
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          {sub}
        </span>
      </span>
    </button>
  );
}
