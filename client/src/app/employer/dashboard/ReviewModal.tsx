"use client";

import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useSubmitReview } from "@/features/employer/dashboard";
import "./modal.css";

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

/** Review modal — the employer rates a completed job (1–5 + optional text). */
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
      toastError(errMessage(e, "Could not submit the review. Please try again."));
    }
  };

  return (
    <div className="ed-overlay">
      <button
        type="button"
        className="ed-scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="ed-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${target.workerName}`}
      >
        <div className="ed-modal-head">
          <div>
            <h2 className="ed-modal-title">Review {target.workerName}</h2>
            <p className="ed-modal-sub">{target.jobType}</p>
          </div>
          <button
            type="button"
            className="ed-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="ed-modal-body">
          <div className="ed-field">
            <span className="ed-label">Rating</span>
            <div className="ed-star-pick">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="ed-star-btn"
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

          <div className="ed-field">
            <label className="ed-label" htmlFor="review-text">
              Your review
            </label>
            <textarea
              id="review-text"
              className="ed-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How was the work? (optional)"
              maxLength={2000}
            />
          </div>

          <div className="ed-modal-foot">
            <button
              type="button"
              className="ed-btn ed-btn-gold"
              onClick={submit}
              disabled={review.isPending}
            >
              {review.isPending ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
