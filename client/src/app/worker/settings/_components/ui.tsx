"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   Small presentational primitives shared across the settings panels.
   Lives in a `_components` private folder so it is never treated as a route.
   ───────────────────────────────────────────────────────────────────────── */

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
    <section className="ws-panel" id={id}>
      <div className="ws-panel-head">
        <div className="ws-panel-headrow">
          <div className={`ws-panel-title${danger ? " danger" : ""}`}>
            {title}
          </div>
          {action}
        </div>
        {subtitle && <div className="ws-panel-sub">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <div className="ws-panel-body">{children}</div>;
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
    <div className="ws-savebar">
      <button
        type="button"
        className="ws-btn ws-btn-sm ws-btn-outline"
        onClick={onCancel}
        disabled={saving}
      >
        Cancel
      </button>
      <button
        type={onSave ? "button" : "submit"}
        className="ws-btn ws-btn-sm ws-btn-gold"
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
    <div className="ws-field">
      <label className="ws-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="ws-error">{error}</span>
      ) : hint ? (
        <span className="ws-hint">{hint}</span>
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
      className={`ws-switch${checked ? " on" : ""}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="ws-switch-dot" />
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
    <div className="ws-toggle-row">
      <div className="ws-toggle-text">
        <div className="ws-toggle-title">{title}</div>
        {sub && <div className="ws-toggle-sub">{sub}</div>}
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
    <span className="ws-saved">
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
    <div className="ws-modal-overlay">
      <button
        type="button"
        className="ws-modal-scrim"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="ws-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ws-modal-body">
          <div className={`ws-modal-title${danger ? " danger" : ""}`}>
            {title}
          </div>
          {children}
        </div>
        <div className="ws-modal-foot">{footer}</div>
      </div>
    </div>
  );
}
