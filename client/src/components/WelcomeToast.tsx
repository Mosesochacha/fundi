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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 max-w-[460px] w-[calc(100%-32px)] text-left bg-navy text-white border-none rounded-[10px] px-4 py-3 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] cursor-pointer font-sans"
    >
      <span className="shrink-0 w-7 h-7 rounded-full bg-gold text-navy grid place-items-center">
        <CircleCheck size={17} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">
          Welcome to Tesilix, {firstName}! 🎉
        </span>
        <span className="text-xs text-white/70">{sub}</span>
      </span>
    </button>
  );
}
