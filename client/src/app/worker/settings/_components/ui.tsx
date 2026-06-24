"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   Small presentational primitives shared across the settings panels.
   Lives in a `_components` private folder so it is never treated as a route.
   ───────────────────────────────────────────────────────────────────────── */

/* ── Shared button classes (mirrors the dashboard's button system) ────────── */
const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 font-sans font-medium text-[13px] px-3.5 py-2 rounded-lg border-[0.5px] border-transparent cursor-pointer no-underline whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-150 disabled:opacity-55 disabled:cursor-default";
const BTN_SM = "text-xs px-[11px] py-1.5";
export const BTN_GOLD =
  "bg-gold text-navy border-gold enabled:hover:bg-gold-dark enabled:hover:border-gold-dark";
export const BTN_OUTLINE =
  "bg-white text-ink-2 border-border enabled:hover:border-gold enabled:hover:bg-gold-light enabled:hover:text-ink";
export const BTN_DANGER =
  "bg-red-600 text-white border-red-600 enabled:hover:bg-red-700 enabled:hover:border-red-700";
export const BTN_DANGER_OUTLINE =
  "bg-white text-red-600 border-red-300 enabled:hover:bg-red-50 enabled:hover:border-red-600";

/** Compose button utility classes. Used by panels via `cn(...)`. */
export function btn(variant: string, sm = false) {
  return cn(BTN_BASE, sm && BTN_SM, variant);
}

/* ── Shared form-field input class ────────────────────────────────────────── */
export const FIELD_INPUT =
  "w-full font-sans text-[13px] text-ink py-[9px] px-3 border-[0.5px] border-border rounded-[7px] bg-cream transition-[border-color,background-color] duration-150 outline-none focus:border-gold focus:bg-white";

/* ── Panel shell ──────────────────────────────────────────────────────────── */
export function Panel({
  id,
  title,
  subtitle,
  danger,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="bg-white border-[0.5px] border-border rounded-xl overflow-hidden"
      id={id}
    >
      <div className="py-4 px-5 border-b-[0.5px] border-border">
        <div className="flex items-center justify-between gap-3">
          <div
            className={cn(
              "text-sm font-medium",
              danger ? "text-red-600" : "text-ink",
            )}
          >
            {title}
          </div>
          {action}
        </div>
        {subtitle && (
          <div className="text-xs text-ink-3 mt-0.5">{subtitle}</div>
        )}
      </div>
      {children}
    </section>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="p-5">{children}</div>;
}

/* ── Save bar ─────────────────────────────────────────────────────────────── */
export function SaveBar({
  onCancel,
  onSave,
  saving,
  disabled,
}: {
  onCancel: () => void;
  onSave?: () => void;
  saving?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 py-3.5 px-5 border-t-[0.5px] border-border bg-cream max-sm:sticky max-sm:bottom-0 max-sm:z-[5]">
      <button
        type="button"
        className={btn(BTN_OUTLINE, true)}
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
      <button
        type={onSave ? "button" : "submit"}
        className={btn(BTN_GOLD, true)}
        onClick={onSave}
        disabled={saving || disabled}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

/* ── Form field wrapper ───────────────────────────────────────────────────── */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col mb-4 last:mb-0">
      <label
        className="text-xs font-medium text-ink-2 mb-1.5"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-[11px] text-red-600 mt-[5px]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-3 mt-[5px]">{hint}</span>
      ) : null}
    </div>
  );
}

/* ── Toggle switch ────────────────────────────────────────────────────────── */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative w-9 h-5 rounded-full border-none cursor-pointer shrink-0 p-0 transition-colors duration-200 disabled:opacity-60 disabled:cursor-default",
        checked ? "bg-gold" : "bg-ink-4",
      )}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200",
          checked && "translate-x-4",
        )}
      />
    </button>
  );
}

/* ── Toggle row (title + sub + switch) ────────────────────────────────────── */
export function ToggleRow({
  title,
  sub,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  sub?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b-[0.5px] border-cream-2 last:border-b-0">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        {sub && (
          <div className="text-[11px] text-ink-3 mt-0.5 leading-[1.45]">
            {sub}
          </div>
        )}
      </div>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={title}
      />
    </div>
  );
}

/* ── Inline "Saved" pill ──────────────────────────────────────────────────── */
export function SavedPill() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 rounded-full py-[3px] px-[9px]">
      <Check size={12} /> Saved
    </span>
  );
}

/* ── Extract a friendly message from an axios error ───────────────────────── */
export function apiError(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response
    ?.data?.message;
  return msg || fallback;
}

/* ── Confirmation modal ───────────────────────────────────────────────────── */
export function Modal({
  title,
  danger,
  onClose,
  children,
  footer,
}: {
  title: string;
  danger?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] bg-navy/45 flex items-center justify-center p-5">
      <button
        type="button"
        className="absolute inset-0 bg-transparent border-none cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[420px] bg-white rounded-[14px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="pt-[22px] px-[22px] pb-1">
          <div
            className={cn(
              "font-serif text-lg font-medium",
              danger ? "text-red-600" : "text-ink",
            )}
          >
            {title}
          </div>
          {children}
        </div>
        <div className="flex justify-end gap-2 pt-[18px] px-[22px] pb-[22px]">
          {footer}
        </div>
      </div>
    </div>
  );
}
