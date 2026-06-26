"use client";

import { AlertTriangle } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  /** Extra content (e.g. a reason textarea) rendered between message and buttons. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for irreversible actions. */
  destructive?: boolean;
  loading?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message = "Are you sure? This cannot be undone.",
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-black/45"
        onClick={() => !loading && onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white border border-border rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.18)] p-5"
      >
        <div className="flex items-start gap-3">
          {destructive && (
            <span className="shrink-0 w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg text-ink leading-tight">
              {title}
            </h3>
            {message && (
              <div className="mt-1 text-sm text-ink-2">{message}</div>
            )}
          </div>
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "red" : "gold"}
            className={
              destructive
                ? "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700"
                : undefined
            }
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
