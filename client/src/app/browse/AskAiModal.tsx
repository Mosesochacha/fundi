"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFindFundi } from "@/features/browse";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * "Ask Tesilix AI" modal - the customer describes a job and Groq recommends the
 * right trade. Backed by the public /ai/find-fundi endpoint (works logged out).
 */
export default function AskAiModal({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const { mutate, data: answer, isPending, isError, reset } = useFindFundi();

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const ask = () => {
    const q = input.trim();
    if (!q || isPending) return;
    reset();
    mutate(q);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-auto px-5 py-[72px]">
      <button
        type="button"
        className="fixed inset-0 cursor-default border-none bg-navy/45 p-0 backdrop-blur-[3px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-[540px] overflow-hidden rounded-[20px] bg-white shadow-[0_30px_80px_rgba(33,28,20,0.32)]"
        role="dialog"
        aria-modal="true"
        aria-label="Ask Tesilix AI"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-cream-2 px-6 py-[22px]">
          <div className="flex items-center gap-3">
            <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-navy text-gold-dark">
              <Sparkles size={20} aria-hidden />
            </span>
            <div>
              <h2 className="m-0 font-serif text-xl font-medium text-ink">
                Ask Tesilix AI
              </h2>
              <p className="mt-0.5 text-sm text-ink-3">
                Describe your job and we&rsquo;ll point you to the right fundi.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border-none bg-gold-light text-ink-3 transition-all duration-150 hover:bg-navy hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="px-6 pb-6 pt-[22px]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask();
            }}
            placeholder="e.g. My kitchen sink has been leaking under the cabinet&hellip;"
            className="min-h-[96px] w-full resize-y rounded-xl border border-border px-[15px] py-[13px] text-[14.5px] leading-[1.5] text-ink outline-none focus:border-gold-dark"
            maxLength={1000}
          />
          <button
            type="button"
            className="mt-[13px] inline-flex items-center gap-2 rounded-[11px] border-none bg-gold-dark px-[22px] py-3 text-[14.5px] font-semibold text-white transition-colors duration-[180ms] hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
            onClick={ask}
            disabled={isPending || !input.trim()}
          >
            <Sparkles size={16} aria-hidden />
            {isPending ? "Thinking…" : "Find my fundi"}
          </button>

          {isPending && (
            <p className="mt-[18px] text-sm text-ink-3">
              Thinking through your job&hellip;
            </p>
          )}
          {answer && !isPending && (
            <div className="mt-[18px] whitespace-pre-wrap rounded-[13px] border border-border bg-cream-2 px-[18px] py-4 text-[14.5px] leading-[1.6] text-ink-2">
              {answer}
            </div>
          )}
          {isError && !isPending && (
            <p className="mt-[18px] text-sm text-red-600">
              Sorry &mdash; the assistant is unavailable right now. Please try
              again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
