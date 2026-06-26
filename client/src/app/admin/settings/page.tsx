"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AdminPageHeader,
  AdminShell,
  ConfirmModal,
  DetailCard,
} from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import {
  type AdminSettings,
  adminEndpoints,
  useAdminAction,
  useAdminSettings,
} from "@/features/admin";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        disabled
          ? "bg-cream-2 cursor-not-allowed opacity-60"
          : "cursor-pointer",
        !disabled && (checked ? "bg-gold" : "bg-ink-4/40"),
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-cream-2 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {desc && <p className="text-[12px] text-ink-3 mt-0.5">{desc}</p>}
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={title}
      />
    </div>
  );
}

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "commission", label: "Commission" },
  { id: "notifications", label: "Notifications" },
  { id: "verification", label: "Verification" },
  { id: "email", label: "Email templates" },
  { id: "danger", label: "Danger zone" },
];

type DangerKind = "reset-stats" | "export-data";

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const { success } = useToastContext();
  const action = useAdminAction();

  const [form, setForm] = useState<AdminSettings | null>(null);
  const [active, setActive] = useState("general");

  // Danger-zone confirm modal state + typed confirmation.
  const [danger, setDanger] = useState<DangerKind | null>(null);
  const [typed, setTyped] = useState("");

  // Seed the editable local copy when data arrives.
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const save = async () => {
    if (!form) return;
    await action.mutateAsync(adminEndpoints.updateSettings(form));
    success("Settings saved.");
  };

  const runDanger = async () => {
    await action.mutateAsync({ action: danger });
    success(
      danger === "reset-stats"
        ? "Platform statistics reset."
        : "User data export started.",
    );
    setDanger(null);
    setTyped("");
  };

  // Helpers to patch a slice of the form.
  const setGeneral = (patch: Partial<AdminSettings["general"]>) =>
    setForm((f) => (f ? { ...f, general: { ...f.general, ...patch } } : f));
  const setCommission = (patch: Partial<AdminSettings["commission"]>) =>
    setForm((f) =>
      f ? { ...f, commission: { ...f.commission, ...patch } } : f,
    );
  const setNotif = (patch: Partial<AdminSettings["notifications"]>) =>
    setForm((f) =>
      f ? { ...f, notifications: { ...f.notifications, ...patch } } : f,
    );
  const setVerif = (patch: Partial<AdminSettings["verification"]>) =>
    setForm((f) =>
      f ? { ...f, verification: { ...f.verification, ...patch } } : f,
    );

  if (isLoading || !form) {
    return (
      <AdminShell>
        <AdminPageHeader title="Settings" subtitle="Platform configuration." />
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton cards
              key={`sk-${i}`}
              className="h-44 bg-white border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Settings"
        subtitle="Platform configuration."
        actions={
          <Button variant="gold" onClick={save}>
            Save changes
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-5">
        {/* In-page nav */}
        <nav className="lg:w-48 lg:shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-20 pb-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "text-left whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer",
                  active === s.id
                    ? "bg-gold-light text-gold-dark font-medium"
                    : "text-ink-3 hover:bg-cream hover:text-ink-2",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Sections */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 scroll-mt-20">
          <div id="general" className="scroll-mt-20">
            <DetailCard title="General">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Platform name"
                  value={form.general.platformName}
                  onChange={(e) => setGeneral({ platformName: e.target.value })}
                />
                <Input
                  label="Support email"
                  type="email"
                  value={form.general.supportEmail}
                  onChange={(e) => setGeneral({ supportEmail: e.target.value })}
                />
                <Input
                  label="Contact phone"
                  value={form.general.contactPhone}
                  onChange={(e) => setGeneral({ contactPhone: e.target.value })}
                />
                <Input
                  label="Platform launch date"
                  type="date"
                  value={form.general.launchDate}
                  onChange={(e) => setGeneral({ launchDate: e.target.value })}
                />
              </div>
              <div className="mt-3">
                <ToggleRow
                  title="Maintenance mode"
                  desc="Take the platform offline for all non-admin users."
                  checked={form.general.maintenanceMode}
                  onChange={(v) => setGeneral({ maintenanceMode: v })}
                />
                <ToggleRow
                  title="New registrations"
                  desc="Allow new accounts to be created."
                  checked={form.general.registrationsOpen}
                  onChange={(v) => setGeneral({ registrationsOpen: v })}
                />
              </div>
            </DetailCard>
          </div>

          <div id="commission" className="scroll-mt-20">
            <DetailCard title="Commission rates">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Transaction fee (%)"
                    type="number"
                    value={form.commission.transactionFeePct}
                    onChange={(e) =>
                      setCommission({
                        transactionFeePct: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-[12px] text-ink-3 mt-1.5">
                    Currently: {form.commission.transactionFeePct}% per
                    completed job
                  </p>
                </div>
                <div>
                  <Input
                    label="Worker subscription (KSh)"
                    type="number"
                    value={form.commission.workerSubscription}
                    onChange={(e) =>
                      setCommission({
                        workerSubscription: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-[12px] text-ink-3 mt-1.5">
                    Currently: KSh {form.commission.workerSubscription} (free if
                    0)
                  </p>
                </div>
                <div>
                  <Input
                    label="Featured listing (KSh / month)"
                    type="number"
                    value={form.commission.featuredListing}
                    onChange={(e) =>
                      setCommission({
                        featuredListing: Number(e.target.value),
                      })
                    }
                  />
                  <p className="text-[12px] text-ink-3 mt-1.5">
                    Currently: KSh {form.commission.featuredListing} / month
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="gold" onClick={save}>
                  Save
                </Button>
              </div>
            </DetailCard>
          </div>

          <div id="notifications" className="scroll-mt-20">
            <DetailCard title="Notification settings">
              <ToggleRow
                title="Email notifications"
                desc="Transactional and digest emails to users."
                checked={form.notifications.email}
                onChange={(v) => setNotif({ email: v })}
              />
              <ToggleRow
                title="Push notifications"
                desc="Browser and mobile push alerts."
                checked={form.notifications.push}
                onChange={(v) => setNotif({ push: v })}
              />
              <ToggleRow
                title="SMS notifications"
                desc="Text-message alerts (coming soon)."
                checked={form.notifications.sms}
                onChange={(v) => setNotif({ sms: v })}
                disabled
              />
            </DetailCard>
          </div>

          <div id="verification" className="scroll-mt-20">
            <DetailCard title="Verification requirements">
              <ToggleRow
                title="Require ID for workers"
                desc="Workers must upload a government ID to be verified."
                checked={form.verification.requireId}
                onChange={(v) => setVerif({ requireId: v })}
              />
              <ToggleRow
                title="Require phone verification"
                desc="Users must verify their phone number."
                checked={form.verification.requirePhone}
                onChange={(v) => setVerif({ requirePhone: v })}
              />
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="min-strength"
                    className="text-sm font-medium text-ink"
                  >
                    Minimum profile strength to appear in search
                  </label>
                  <span className="text-sm font-semibold text-gold-dark tabular-nums">
                    {form.verification.minProfileStrength}%
                  </span>
                </div>
                <input
                  id="min-strength"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.verification.minProfileStrength}
                  onChange={(e) =>
                    setVerif({ minProfileStrength: Number(e.target.value) })
                  }
                  className="w-full accent-gold cursor-pointer"
                />
              </div>
            </DetailCard>
          </div>

          <div id="email" className="scroll-mt-20">
            <DetailCard title="Email templates">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-ink-3">
                  Manage all transactional email templates.
                </p>
                <Link href="/admin/settings/email" className="no-underline">
                  <Button variant="outline" icon={<Mail size={15} />}>
                    Email templates
                  </Button>
                </Link>
              </div>
            </DetailCard>
          </div>

          <div id="danger" className="scroll-mt-20">
            <DetailCard title="Danger zone" danger>
              <div className="divide-y divide-cream-2">
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      Clear all test data (dev only)
                    </p>
                    <p className="text-[12px] text-ink-3 mt-0.5">
                      Disabled in production.
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Clear
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      Reset platform statistics
                    </p>
                    <p className="text-[12px] text-ink-3 mt-0.5">
                      Permanently zero out all aggregate counters.
                    </p>
                  </div>
                  <Button
                    variant="red"
                    onClick={() => {
                      setDanger("reset-stats");
                      setTyped("");
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">
                      Export all user data (GDPR / Data Protection Act)
                    </p>
                    <p className="text-[12px] text-ink-3 mt-0.5">
                      Generate a full export of all personal data.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDanger("export-data");
                      setTyped("");
                    }}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </DetailCard>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!danger}
        title={
          danger === "reset-stats"
            ? "Reset platform statistics"
            : "Export all user data"
        }
        message={
          danger === "reset-stats"
            ? "This permanently zeroes all aggregate statistics. Type CONFIRM to proceed."
            : "This generates a full export of all user data. Type CONFIRM to proceed."
        }
        confirmLabel={danger === "reset-stats" ? "Reset" : "Export"}
        destructive={danger === "reset-stats"}
        loading={action.isPending}
        confirmDisabled={typed !== "CONFIRM"}
        onConfirm={runDanger}
        onCancel={() => {
          setDanger(null);
          setTyped("");
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="Type CONFIRM"
          className="w-full px-3.5 py-2.5 rounded-lg text-sm border border-border bg-cream text-ink placeholder:text-ink-3 outline-none focus:border-gold focus:bg-white"
        />
      </ConfirmModal>
    </AdminShell>
  );
}
