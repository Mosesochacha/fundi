"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  type AvailabilitySettings,
  type MaxDistance,
  type PrivacySettings,
  useUpdateAvailability,
  useUpdatePrivacy,
  type WorkerSettings,
} from "@/features/worker/settings";
import { cn } from "@/lib/utils";
import {
  apiError,
  FIELD_INPUT,
  Field,
  Panel,
  PanelBody,
  SaveBar,
  ToggleRow,
} from "../_components/ui";

/** Build "HH:00" → "7am"-style options for an inclusive hour range. */
function hourOptions(from: number, to: number) {
  const opts: { value: string; label: string }[] = [];
  for (let h = from; h <= to; h++) {
    const value = `${String(h).padStart(2, "0")}:00`;
    const period = h < 12 ? "am" : "pm";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    opts.push({ value, label: `${hour12}${period}` });
  }
  return opts;
}
const FROM_OPTIONS = hourOptions(5, 12);
const TO_OPTIONS = hourOptions(12, 22);

const DISTANCE_OPTIONS: { value: MaxDistance; label: string }[] = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
  { value: "any", label: "Any distance" },
];

const PRIVACY_ROWS: {
  key: keyof PrivacySettings;
  title: string;
  sub: string;
  /** Worker-only concept - hidden for employers. */
  workerOnly?: boolean;
}[] = [
  {
    key: "publicProfile",
    title: "Public profile",
    sub: "Your profile is visible to anyone browsing Tesilix",
  },
  {
    key: "showPhone",
    title: "Show phone number",
    sub: "Phone number shared only after a job is confirmed",
  },
  {
    key: "showRate",
    title: "Show daily rate",
    sub: "Display your rate on your public profile",
    workerOnly: true,
  },
  {
    key: "showOnline",
    title: "Show online status",
    sub: "Let employers see when you are active",
  },
  {
    key: "allowDirectMessages",
    title: "Allow direct messages",
    sub: "Employers can message you without a job request",
  },
  {
    key: "appearInSearch",
    title: "Appear in search results",
    sub: "Show up when employers search for your trade",
    workerOnly: true,
  },
];

const sameAvail = (a: AvailabilitySettings, b: AvailabilitySettings) =>
  (Object.keys(a) as (keyof AvailabilitySettings)[]).every(
    (k) => a[k] === b[k],
  );
const samePriv = (a: PrivacySettings, b: PrivacySettings) =>
  (Object.keys(a) as (keyof PrivacySettings)[]).every((k) => a[k] === b[k]);

export default function AvailabilityPrivacyPanel({
  settings,
  onDirty,
  showAvailability = true,
}: {
  settings: WorkerSettings;
  onDirty: (dirty: boolean) => void;
  /** Availability is worker-only; employers see just the privacy controls. */
  showAvailability?: boolean;
}) {
  const { success, error: toastError } = useToastContext();
  const updateAvail = useUpdateAvailability();
  const updatePriv = useUpdatePrivacy();

  const [avail, setAvail] = useState<AvailabilitySettings>(
    settings.availability,
  );
  const [priv, setPriv] = useState<PrivacySettings>(settings.privacy);

  const availDirty = !sameAvail(avail, settings.availability);
  const privDirty = !samePriv(priv, settings.privacy);
  const dirty = availDirty || privDirty;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const setA = <K extends keyof AvailabilitySettings>(
    key: K,
    value: AvailabilitySettings[K],
  ) => setAvail((s) => ({ ...s, [key]: value }));

  async function save() {
    try {
      if (availDirty) await updateAvail.mutateAsync(avail);
      if (privDirty) await updatePriv.mutateAsync(priv);
      success("Settings saved");
    } catch (e) {
      toastError(apiError(e, "Could not save settings"));
    }
  }

  function cancel() {
    setAvail(settings.availability);
    setPriv(settings.privacy);
  }

  const saving = updateAvail.isPending || updatePriv.isPending;

  return (
    <Panel
      id="availability"
      title={showAvailability ? "Availability & privacy" : "Privacy"}
      subtitle={
        showAvailability
          ? "Set when and where you take on work, and what employers can see."
          : "Control what others can see on your profile."
      }
    >
      <PanelBody>
        {showAvailability && (
          <div>
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-3 mb-1.5">
              Availability
            </div>
            <ToggleRow
              title="Available for work"
              sub="Turn off to pause all new job requests"
              checked={avail.available}
              onChange={(next) => setA("available", next)}
            />
            {!avail.available && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg py-2.5 px-3 text-sm leading-[1.45] mt-3.5 [&>svg]:shrink-0 [&>svg]:mt-px">
                <AlertTriangle size={15} />
                <span>Your profile is paused. Employers cannot see you.</span>
              </div>
            )}
            <ToggleRow
              title="Emergency callouts"
              sub="Available for same-day urgent jobs"
              checked={avail.emergencyCallouts}
              onChange={(next) => setA("emergencyCallouts", next)}
            />
            <ToggleRow
              title="Weekend availability"
              sub="Accept jobs on Saturdays and Sundays"
              checked={avail.weekends}
              onChange={(next) => setA("weekends", next)}
            />

            <div className="pt-4 mt-4 border-t-[0.5px] border-border">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Working hours from" htmlFor="hoursFrom">
                  <select
                    id="hoursFrom"
                    className={FIELD_INPUT}
                    value={avail.workingHoursFrom}
                    onChange={(e) => setA("workingHoursFrom", e.target.value)}
                  >
                    {FROM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Working hours to" htmlFor="hoursTo">
                  <select
                    id="hoursTo"
                    className={FIELD_INPUT}
                    value={avail.workingHoursTo}
                    onChange={(e) => setA("workingHoursTo", e.target.value)}
                  >
                    {TO_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Max job distance" htmlFor="maxDistance">
                <select
                  id="maxDistance"
                  className={FIELD_INPUT}
                  value={avail.maxDistance}
                  onChange={(e) =>
                    setA("maxDistance", e.target.value as MaxDistance)
                  }
                >
                  {DISTANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        <div className={cn(showAvailability && "mt-[22px]")}>
          <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-ink-3 mb-1.5">
            Privacy
          </div>
          {PRIVACY_ROWS.filter(
            (row) => showAvailability || !row.workerOnly,
          ).map((row) => (
            <ToggleRow
              key={row.key}
              title={row.title}
              sub={row.sub}
              checked={priv[row.key]}
              onChange={(next) => setPriv({ ...priv, [row.key]: next })}
            />
          ))}
        </div>
      </PanelBody>

      <SaveBar
        onCancel={cancel}
        onSave={save}
        saving={saving}
        disabled={!dirty}
      />
    </Panel>
  );
}
