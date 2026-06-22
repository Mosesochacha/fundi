"use client";

import { Check, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { dashboardPathForRole } from "@/lib/authRedirect";

const CONFETTI_COLORS = [
  "#f97316",
  "#E05A2B",
  "#22c55e",
  "#2563eb",
  "#7c3aed",
  "#d97706",
];

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${5 + ((i * 5) % 90)}%`,
    delay: `${(i * 0.15) % 2}s`,
    duration: `${1.5 + (i % 5) * 0.3}s`,
    size: 8 + (i % 4) * 4,
    rotation: i * 47,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) translateX(${Math.random() > 0.5 ? "" : "-"}60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function SetupCompletePage() {
  const { profile, role } = useAuth();
  const [copied, setCopied] = useState(false);

  const url = profile?.username
    ? `fundi.co.ke/${profile.username}`
    : "fundi.co.ke/you";
  const fullUrl = `https://${url}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Check out my profile: ${fullUrl}`)}`;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <Confetti />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Checkmark */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
          style={{ backgroundColor: "#22c55e" }}
        >
          <Check size={40} className="text-white" strokeWidth={3} />
        </div>

        <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
          You&apos;re live!
        </h1>
        <p className="text-gray-500 mb-4">Your profile is now live at:</p>

        {/* Profile URL */}
        <button
          type="button"
          onClick={copyUrl}
          className="text-lg font-semibold mb-8 flex items-center gap-2 group"
          style={{ color: "#f97316" }}
        >
          {url}
          {copied ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : (
            <Copy
              size={16}
              className="text-gray-400 group-hover:text-[#f97316] transition-colors"
            />
          )}
        </button>
        {copied && (
          <p className="text-xs text-green-600 -mt-6 mb-4">
            Copied to clipboard!
          </p>
        )}

        {/* Actions */}
        <div className="w-full space-y-3">
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl text-white font-semibold h-[52px] transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#f97316" }}
          >
            Share on WhatsApp
          </a>

          <button
            type="button"
            onClick={copyUrl}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold h-[52px] border-2 transition-colors hover:bg-orange-50"
            style={{ borderColor: "#f97316", color: "#f97316" }}
          >
            {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            Copy profile link
          </button>

          <Link
            href={dashboardPathForRole(role)}
            className="block w-full text-center py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Go to my dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
