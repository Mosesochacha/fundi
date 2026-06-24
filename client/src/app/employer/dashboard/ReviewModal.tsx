"use client";

import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useSubmitReview } from "@/features/employer/dashboard";

interface ReviewTarget {
  jobId: string;
  workerName: string;
  jobType: string;
}

interface Props {
  target: ReviewTarget | null;
  onClose: () => void;
}

function errMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null) {
    const res = (e as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  return fallback;
}

/** Review modal - the employer rates a completed job (1–5 + optional text). */
export default function ReviewModal({ target, onClose }: Props) {
  const { success, error: toastError } = useToastContext();
  const review = useSubmitReview();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!target) return;
    setRating(0);
    setText("");
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  const submit = async () => {
    if (rating < 1) return toastError("Please pick a star rating.");
    try {
      await review.mutateAsync({
        jobId: target.jobId,
        rating,
        text: text.trim() || undefined,
      });
      success("Review submitted. Thank you!");
      onClose();
    } catch (e) {
      toastError(
        errMessage(e, "Could not submit the review. Please try again."),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center p-4 font-sans">
      <button
        type="button"
        className="absolute inset-0 bg-navy/45 border-0 cursor-pointer"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-[1] w-full max-w-[440px] max-h-[calc(100vh-32px)] overflow-y-auto bg-white rounded-[14px] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.4)]"
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${target.workerName}`}
      >
        <div className="flex items-start justify-between gap-3 px-[18px] pt-[18px] pb-3 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-normal text-ink">
              Review {target.workerName}
            </h2>
            <p className="text-sm text-ink-3 mt-0.5">{target.jobType}</p>
          </div>
          <button
            type="button"
            className="shrink-0 w-7 h-7 rounded-lg border border-border bg-white text-ink-2 grid place-items-center cursor-pointer hover:bg-cream"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="px-[18px] pt-4 pb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-[5px]">
            <span className="text-sm font-medium text-ink-2">Rating</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="bg-none border-0 p-0.5 cursor-pointer text-gold leading-none"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Star
                    size={26}
                    fill={n <= rating ? "currentColor" : "none"}
                    strokeWidth={n <= rating ? 0 : 1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label
              className="text-sm font-medium text-ink-2"
              htmlFor="review-text"
            >
              Your review
            </label>
            <textarea
              id="review-text"
              className="font-sans text-sm text-ink bg-white border border-border rounded-lg px-[11px] py-[9px] w-full outline-none focus:border-gold resize-y min-h-[76px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How was the work? (optional)"
              maxLength={2000}
            />
          </div>

          <div className="mt-1">
            <Button
              type="button"
              variant="gold"
              className="w-full"
              onClick={submit}
              disabled={review.isPending}
            >
              {review.isPending ? "Submitting…" : "Submit review"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
