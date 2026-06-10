"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToastContext } from "@/context/ToastContext";
import {
  TRADES,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
  type WorkerSettings,
} from "@/features/worker/settings";
import { apiError, Field, Panel, PanelBody, SaveBar } from "../_components/ui";

const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  profession: z.string(),
  location: z.string(),
  about: z.string().max(500, "About must be at most 500 characters"),
  dailyRate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(999999, "Rate is too high")
    .nullable(),
});

type FormValues = z.infer<typeof schema>;

const initialsOf = (a: string, b: string) =>
  `${a[0] ?? ""}${b[0] ?? ""}`.toUpperCase() || "U";

export default function ProfilePanel({
  settings,
  onDirty,
}: {
  settings: WorkerSettings;
  onDirty: (dirty: boolean) => void;
}) {
  const { success, error: toastError } = useToastContext();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileRef = useRef<HTMLInputElement>(null);

  const defaults: FormValues = {
    firstName: settings.profile.firstName,
    lastName: settings.profile.lastName,
    username: settings.profile.username,
    profession: settings.profile.profession,
    location: settings.profile.location,
    about: settings.profile.about,
    dailyRate: settings.profile.dailyRate,
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Keep the parent's unsaved-changes flag in sync.
  useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

  const username = watch("username");
  const aboutValue = watch("about") ?? "";

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync(values);
      reset(values); // clears dirty state
      success("Settings saved");
    } catch (e) {
      toastError(apiError(e, "Could not save your profile"));
    }
  });

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toastError("Image must be 2MB or smaller");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
      success("Photo updated");
    } catch (err) {
      toastError(apiError(err, "Could not upload photo"));
    }
  }

  async function onRemoveAvatar() {
    try {
      await removeAvatar.mutateAsync();
      success("Photo removed");
    } catch (err) {
      toastError(apiError(err, "Could not remove photo"));
    }
  }

  const name =
    [defaults.firstName, defaults.lastName].filter(Boolean).join(" ").trim() ||
    "Your profile";

  return (
    <Panel
      id="profile"
      title="Profile"
      subtitle="How you appear to employers on Fundi."
    >
      <form onSubmit={onSubmit}>
        <PanelBody>
          {/* Avatar */}
          <div className="ws-avatar-row">
            <div className="ws-avatar">
              {settings.profile.avatarUrl ? (
                <img src={settings.profile.avatarUrl} alt={name} />
              ) : (
                initialsOf(defaults.firstName, defaults.lastName)
              )}
            </div>
            <div className="ws-avatar-meta">
              <div className="ws-avatar-name">{name}</div>
              <div className="ws-avatar-sub">JPG or PNG · Max 2MB</div>
              <div className="ws-avatar-actions">
                <button
                  type="button"
                  className="ws-btn ws-btn-sm ws-btn-outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
                </button>
                {settings.profile.avatarUrl && (
                  <button
                    type="button"
                    className="ws-btn ws-btn-sm ws-btn-text"
                    onClick={onRemoveAvatar}
                    disabled={removeAvatar.isPending}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                hidden
                onChange={onPickAvatar}
              />
            </div>
          </div>

          {/* Name */}
          <div className="ws-grid2">
            <Field
              label="First name"
              htmlFor="firstName"
              error={errors.firstName?.message}
            >
              <input
                id="firstName"
                className={`ws-input${errors.firstName ? " invalid" : ""}`}
                {...register("firstName")}
              />
            </Field>
            <Field
              label="Last name"
              htmlFor="lastName"
              error={errors.lastName?.message}
            >
              <input
                id="lastName"
                className={`ws-input${errors.lastName ? " invalid" : ""}`}
                {...register("lastName")}
              />
            </Field>
          </div>

          <Field
            label="Username"
            htmlFor="username"
            error={errors.username?.message}
            hint={`fundi.app/${username || "username"}`}
          >
            <input
              id="username"
              className={`ws-input${errors.username ? " invalid" : ""}`}
              {...register("username")}
            />
          </Field>

          <Field label="Trade / profession" htmlFor="profession">
            <select
              id="profession"
              className="ws-select"
              {...register("profession")}
            >
              <option value="">Select your trade</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location" htmlFor="location">
            <input
              id="location"
              className="ws-input"
              {...register("location")}
            />
          </Field>

          <Field
            label="About"
            htmlFor="about"
            error={errors.about?.message}
            hint={`${aboutValue.length}/500`}
          >
            <textarea
              id="about"
              rows={3}
              className={`ws-textarea${errors.about ? " invalid" : ""}`}
              {...register("about")}
            />
          </Field>

          <Field
            label="Daily rate (KSh)"
            htmlFor="dailyRate"
            error={errors.dailyRate?.message}
            hint="Shown on your public profile"
          >
            <input
              id="dailyRate"
              type="number"
              min={0}
              className={`ws-input${errors.dailyRate ? " invalid" : ""}`}
              {...register("dailyRate", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>
        </PanelBody>

        <SaveBar
          onCancel={() => reset(defaults)}
          saving={updateProfile.isPending}
          disabled={!isDirty}
        />
      </form>
    </Panel>
  );
}
