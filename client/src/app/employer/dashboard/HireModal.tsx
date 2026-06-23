"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import { useHireWorker } from "@/features/employer/dashboard";

interface HireTarget {
  id: string;
  name: string;
  trade: string;
}

interface Props {
  worker: HireTarget | null;
  defaultLocation?: string;
  onClose: () => void;
}

function errMessage(e: unknown, fallback: string): string {
  if (typeof e === "object" && e !== null) {
    const res = (e as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) return res.data.message;
  }
  return fallback;
}

/**
 * Hire-request modal. The worker + trade are prefilled read-only; the employer
 * fills schedule, location, description and an optional budget, then we POST a
 * job request (which also opens the chat thread on the backend).
 */
export default function HireModal({ worker, defaultLocation, onClose }: Props) {
  const { success, error: toastError } = useToastContext();
  const hire = useHireWorker();

  const [jobType, setJobType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");

  // Prefill from the worker/employer each time the modal opens for a worker.
  useEffect(() => {
    if (!worker) return;
    setJobType(worker.trade ?? "");
    setLocation(defaultLocation ?? "");
    setDate("");
    setTime("");
    setDescription("");
    setBudget("");
  }, [worker, defaultLocation]);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!worker) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [worker, onClose]);

  if (!worker) return null;

  const submit = async () => {
    if (!jobType.trim()) return toastError("Please enter a job type.");
    if (!location.trim()) return toastError("Please enter a location.");

    const scheduledAt =
      date && time
        ? new Date(`${date}T${time}`).toISOString()
        : date
          ? new Date(date).toISOString()
          : undefined;
    const budgetNum = budget ? Number(budget.replace(/[^0-9]/g, "")) : undefined;

    try {
      await hire.mutateAsync({
        workerId: worker.id,
        jobType: jobType.trim(),
        location: location.trim(),
        description: description.trim() || undefined,
        scheduledAt,
        budget: Number.isFinite(budgetNum) ? budgetNum : undefined,
      });
      success(`Request sent to ${worker.name}.`);
      onClose();
    } catch (e) {
      toastError(errMessage(e, "Could not send the request. Please try again."));
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
        aria-label={`Hire ${worker.name}`}
      >
        <div className="ed-modal-head">
          <div>
            <h2 className="ed-modal-title">Hire {worker.name}</h2>
            <p className="ed-modal-sub">{worker.trade || "Fundi"}</p>
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
            <label className="ed-label" htmlFor="hire-jobtype">
              Job type
            </label>
            <input
              id="hire-jobtype"
              className="ed-input"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              placeholder="e.g. Kitchen sink repair"
            />
          </div>

          <div className="ed-row2">
            <div className="ed-field">
              <label className="ed-label" htmlFor="hire-date">
                Date
              </label>
              <input
                id="hire-date"
                type="date"
                className="ed-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="ed-field">
              <label className="ed-label" htmlFor="hire-time">
                Time
              </label>
              <input
                id="hire-time"
                type="time"
                className="ed-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="ed-field">
            <label className="ed-label" htmlFor="hire-location">
              Location
            </label>
            <input
              id="hire-location"
              className="ed-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where is the job?"
            />
          </div>

          <div className="ed-field">
            <label className="ed-label" htmlFor="hire-desc">
              Description
            </label>
            <textarea
              id="hire-desc"
              className="ed-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need done…"
              maxLength={2000}
            />
          </div>

          <div className="ed-field">
            <label className="ed-label" htmlFor="hire-budget">
              Budget (optional)
            </label>
            <input
              id="hire-budget"
              className="ed-input"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="KSh per day"
            />
          </div>

          <div className="ed-modal-foot">
            <button
              type="button"
              className="ed-btn ed-btn-gold"
              onClick={submit}
              disabled={hire.isPending}
            >
              {hire.isPending ? "Sending…" : "Send request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
