"use client";

import { useCallback, useState } from "react";
import type { Toast, ToastType } from "@/components/ui/Toast";

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = String(++toastIdCounter);
      setToasts((prev) => {
        const updated = prev.length >= 3 ? prev.slice(1) : prev;
        return [...updated, { id, type, message, duration }];
      });
    },
    [],
  );

  return {
    toasts,
    dismiss,
    error: (msg: string) => toast(msg, "error", 5000),
    success: (msg: string) => toast(msg, "success", 4000),
    info: (msg: string) => toast(msg, "info", 3000),
    warning: (msg: string, duration = 6000) => toast(msg, "warning", duration),
  };
};
