"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFindFundi } from "@/features/browse";

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * "Ask Fundi AI" modal — the customer describes a job and Groq recommends the
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
    <div className="ai-overlay">
      <button
        type="button"
        className="ai-scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="ai-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Ask Fundi AI"
      >
        <div className="ai-head">
          <div className="ai-head-main">
            <span className="ai-head-icon">
              <Sparkles size={20} aria-hidden />
            </span>
            <div>
              <h2 className="ai-title">Ask Fundi AI</h2>
              <p className="ai-sub">
                Describe your job and we&rsquo;ll point you to the right fundi.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ai-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="ai-body">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") ask();
            }}
            placeholder="e.g. My kitchen sink has been leaking under the cabinet&hellip;"
            className="ai-textarea"
            maxLength={1000}
          />
          <button
            type="button"
            className="ai-submit"
            onClick={ask}
            disabled={isPending || !input.trim()}
          >
            <Sparkles size={16} aria-hidden />
            {isPending ? "Thinking…" : "Find my fundi"}
          </button>

          {isPending && (
            <p className="ai-status">Thinking through your job&hellip;</p>
          )}
          {answer && !isPending && <div className="ai-answer">{answer}</div>}
          {isError && !isPending && (
            <p className="ai-error">
              Sorry &mdash; the assistant is unavailable right now. Please try
              again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
