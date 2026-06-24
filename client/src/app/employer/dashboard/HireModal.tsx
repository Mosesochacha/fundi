"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useAuth } from "@/features/auth";
import { useHireWorker } from "@/features/employer/dashboard";
import { symbolOf } from "@/lib/currency";

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
  const { user } = useAuth();
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
    const budgetNum = budget
      ? Number(budget.replace(/[^0-9]/g, ""))
      : undefined;

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
      toastError(
        errMessage(e, "Could not send the request. Please try again."),
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
        aria-label={`Hire ${worker.name}`}
      >
        <div className="flex items-start justify-between gap-3 px-[18px] pt-[18px] pb-3 border-b border-border">
          <div>
            <h2 className="font-serif text-lg font-normal text-ink">
              Hire {worker.name}
            </h2>
            <p className="text-sm text-ink-3 mt-0.5">
              {worker.trade || "Tesilix"}
            </p>
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
          <div className={FIELD}>
            <label className={LABEL} htmlFor="hire-jobtype">
              Job type
            </label>
            <input
              id="hire-jobtype"
              className={INPUT}
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              placeholder="e.g. Kitchen sink repair"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className={FIELD}>
              <label className={LABEL} htmlFor="hire-date">
                Date
              </label>
              <input
                id="hire-date"
                type="date"
                className={INPUT}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className={FIELD}>
              <label className={LABEL} htmlFor="hire-time">
                Time
              </label>
              <input
                id="hire-time"
                type="time"
                className={INPUT}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="hire-location">
              Location
            </label>
            <input
              id="hire-location"
              className={INPUT}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where is the job?"
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="hire-desc">
              Description
            </label>
            <textarea
              id="hire-desc"
              className={TEXTAREA}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need done…"
              maxLength={2000}
            />
          </div>

          <div className={FIELD}>
            <label className={LABEL} htmlFor="hire-budget">
              Budget (optional)
            </label>
            <input
              id="hire-budget"
              className={INPUT}
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={`${symbolOf(user?.currency)} per day`}
            />
          </div>

          <div className="mt-1">
            <Button
              type="button"
              variant="gold"
              className="w-full"
              onClick={submit}
              disabled={hire.isPending}
            >
              {hire.isPending ? "Sending…" : "Send request"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FIELD = "flex flex-col gap-[5px]";
const LABEL = "text-sm font-medium text-ink-2";
const INPUT =
  "font-sans text-sm text-ink bg-white border border-border rounded-lg px-[11px] py-[9px] w-full outline-none focus:border-gold";
const TEXTAREA = `${INPUT} resize-y min-h-[76px]`;
