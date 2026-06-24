"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastType = "error" | "success" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const toastConfig = {
  error: {
    bg: "bg-red-50",
    bar: "bg-red-600",
    iconBg: "bg-red-100",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 5v4M8 11h.01"
          stroke="#DC2626"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5" />
      </svg>
    ),
  },
  success: {
    bg: "bg-green-50",
    bar: "bg-green-600",
    iconBg: "bg-green-100",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M3 8l3.5 3.5L13 4.5"
          stroke="#16A34A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.5" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-50",
    bar: "bg-blue-600",
    iconBg: "bg-blue-100",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 7v5M8 5h.01"
          stroke="#2563EB"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="8" r="7" stroke="#2563EB" strokeWidth="1.5" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-amber-50",
    bar: "bg-amber-600",
    iconBg: "bg-amber-100",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 2L14.5 13H1.5L8 2z"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 6v4M8 11.5h.01"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;
  const config = toastConfig[toast.type];

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress((prev) => prev - 100 / (duration / 50));
    }, 50);
    return () => clearInterval(interval);
  }, [paused, duration]);

  useEffect(() => {
    if (progress <= 0) {
      onDismiss(toast.id);
    }
  }, [progress, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative w-full max-w-[420px] rounded-xl overflow-hidden pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] ${config.bg}`}
    >
      {/* Left coloured bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${config.bar}`}
      />

      {/* Content */}
      <div className="flex items-center gap-3 pl-5 pr-4 py-3.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}
        >
          {config.icon}
        </div>

        <p className="flex-1 m-0 text-sm leading-normal text-gray-900 font-sans font-normal">
          {toast.message}
        </p>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="bg-transparent border-none cursor-pointer p-1 text-gray-400 flex items-center rounded-md shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[3px] opacity-40 ${config.bar} ${
          paused ? "" : "transition-[width] duration-[50ms] ease-linear"
        }`}
        style={{ width: `${progress}%` }}
      />
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 items-center w-[calc(100%-32px)] max-w-[420px] pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.slice(0, 3).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
