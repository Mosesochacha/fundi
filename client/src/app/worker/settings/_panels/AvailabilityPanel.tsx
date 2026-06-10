"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToastContext } from "@/context/ToastContext";
import {
  type AvailabilitySettings,
  type MaxDistance,
  useUpdateAvailability,
  type WorkerSettings,
} from "@/features/worker/settings";
import {
  apiError,
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
const FROM_OPTIONS = hourOptions(5, 12); // 5am – 12pm
const TO_OPTIONS = hourOptions(12, 22); // 12pm – 10pm

const DISTANCE_OPTIONS: { value: MaxDistance; label: string }[] = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "50", label: "50 km" },
  { value: "any", label: "Any distance" },
];

const sameAs = (a: AvailabilitySettings, b: AvailabilitySettings) =>
  (Object.keys(a) as (keyof AvailabilitySettings)[]).every(
    (k) => a[k] === b[k],
  );

export default function AvailabilityPanel({
  settings,
  onDirty,
}: {
  settings: WorkerSettings;
  onDirty: (dirty: boolean) => void;
}) {
  const { success, error: toastError } = useToastContext();
  const update = useUpdateAvailability();
  const [state, setState] = useState<AvailabilitySettings>(
    settings.availability,
  );

  const dirty = !sameAs(state, settings.availability);
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  const set = <K extends keyof AvailabilitySettings>(
    key: K,
    value: AvailabilitySettings[K],
  ) => setState((s) => ({ ...s, [key]: value }));

  async function save() {
    try {
      await update.mutateAsync(state);
      success("Settings saved");
    } catch (e) {
      toastError(apiError(e, "Could not save availability"));
    }
  }

  return (
    <Panel
      id="availability"
      title="Availability"
      subtitle="Set when and where you take on work."
    >
      <PanelBody>
        <ToggleRow
          title="Available for work"
          sub="Turn off to pause all new job requests"
          checked={state.available}
          onChange={(next) => set("available", next)}
        />
        {!state.available && (
          <div className="ws-banner">
            <AlertTriangle size={15} />
            <span>Your profile is paused. Employers cannot see you.</span>
          </div>
        )}

        <ToggleRow
          title="Emergency callouts"
          sub="Available for same-day urgent jobs"
          checked={state.emergencyCallouts}
          onChange={(next) => set("emergencyCallouts", next)}
        />
        <ToggleRow
          title="Weekend availability"
          sub="Accept jobs on Saturdays and Sundays"
          checked={state.weekends}
          onChange={(next) => set("weekends", next)}
        />

        <div className="ws-section">
          <div className="ws-grid2">
            <Field label="Working hours from" htmlFor="hoursFrom">
              <select
                id="hoursFrom"
                className="ws-select"
                value={state.workingHoursFrom}
                onChange={(e) => set("workingHoursFrom", e.target.value)}
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
                className="ws-select"
                value={state.workingHoursTo}
                onChange={(e) => set("workingHoursTo", e.target.value)}
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
              className="ws-select"
              value={state.maxDistance}
              onChange={(e) =>
                set("maxDistance", e.target.value as MaxDistance)
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
      </PanelBody>
      <SaveBar
        onCancel={() => setState(settings.availability)}
        onSave={save}
        saving={update.isPending}
        disabled={!dirty}
      />
    </Panel>
  );
}
