"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type ToastType = "error" | "success" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

const toastConfig = {
  error: {
    bg: "#FEF2F2",
    bar: "#DC2626",
    iconBg: "#FEE2E2",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 5v4M8 11h.01" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="8" r="7" stroke="#DC2626" strokeWidth="1.5" />
      </svg>
    ),
  },
  success: {
    bg: "#F0FDF4",
    bar: "#16A34A",
    iconBg: "#DCFCE7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5L13 4.5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="7" stroke="#16A34A" strokeWidth="1.5" />
      </svg>
    ),
  },
  info: {
    bg: "#EFF6FF",
    bar: "#2563EB",
    iconBg: "#DBEAFE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 7v5M8 5h.01" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="8" r="7" stroke="#2563EB" strokeWidth="1.5" />
      </svg>
    ),
  },
  warning: {
    bg: "#FFFBEB",
    bar: "#D97706",
    iconBg: "#FEF3C7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2L14.5 13H1.5L8 2z" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6v4M8 11.5h.01" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
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
      style={{
        background: config.bg,
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        pointerEvents: "all",
      }}
    >
      {/* Left coloured bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          background: config.bar,
          borderRadius: "12px 0 0 12px",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px 14px 20px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: config.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {config.icon}
        </div>

        <p
          style={{
            flex: 1,
            margin: 0,
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#111827",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 400,
          }}
        >
          {toast.message}
        </p>

        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "#9CA3AF",
            display: "flex",
            alignItems: "center",
            borderRadius: "6px",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          background: config.bar,
          width: `${progress}%`,
          transition: paused ? "none" : "width 50ms linear",
          opacity: 0.4,
        }}
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
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "center",
        width: "calc(100% - 32px)",
        maxWidth: "420px",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence mode="sync">
        {toasts.slice(0, 3).map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};
