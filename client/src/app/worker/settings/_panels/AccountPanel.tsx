"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToastContext } from "@/context/ToastContext";
import {
  useDisconnectGoogle,
  useUpdateEmail,
  useUpdatePassword,
  useUpdatePhone,
  useVerifyEmail,
  useVerifyPhone,
  type WorkerSettings,
} from "@/features/worker/settings";
import { apiError, Field, Panel, PanelBody } from "../_components/ui";

/* ── Email / phone forms ──────────────────────────────────────────────────── */
const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});
const phoneSchema = z.object({
  phone: z.string().min(7, "Enter a valid phone number"),
});

/* ── Password form ────────────────────────────────────────────────────────── */
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

/** 0–3 strength score for a candidate password. */
function strengthOf(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3;
}
const STRENGTH = [
  { label: "", cls: "", width: "0%" },
  { label: "Weak", cls: "weak", width: "33%" },
  { label: "Fair", cls: "fair", width: "66%" },
  { label: "Strong", cls: "strong", width: "100%" },
] as const;

export default function AccountPanel({
  settings,
}: {
  settings: WorkerSettings;
}) {
  const { success, error: toastError } = useToastContext();
  const { account } = settings;

  const updateEmail = useUpdateEmail();
  const verifyEmail = useVerifyEmail();
  const updatePhone = useUpdatePhone();
  const verifyPhone = useVerifyPhone();
  const updatePassword = useUpdatePassword();
  const disconnectGoogle = useDisconnectGoogle();

  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone);

  async function saveEmail() {
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      toastError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    try {
      await updateEmail.mutateAsync({ email });
      success("Email updated");
    } catch (e) {
      toastError(apiError(e, "Could not update email"));
    }
  }

  async function savePhone() {
    const parsed = phoneSchema.safeParse({ phone });
    if (!parsed.success) {
      toastError(
        parsed.error.issues[0]?.message ?? "Enter a valid phone number",
      );
      return;
    }
    try {
      await updatePhone.mutateAsync({ phone });
      success("Phone number updated");
    } catch (e) {
      toastError(apiError(e, "Could not update phone number"));
    }
  }

  async function onVerifyEmail() {
    try {
      await verifyEmail.mutateAsync();
      success("Verification email sent");
    } catch (e) {
      toastError(apiError(e, "Could not send verification email"));
    }
  }

  async function onVerifyPhone() {
    try {
      await verifyPhone.mutateAsync();
      success("Verification code sent");
    } catch (e) {
      toastError(apiError(e, "Could not send verification code"));
    }
  }

  async function onDisconnectGoogle() {
    try {
      await disconnectGoogle.mutateAsync();
      success("Google account disconnected");
    } catch (e) {
      toastError(apiError(e, "Could not disconnect Google"));
    }
  }

  /* Password form */
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const strength = STRENGTH[strengthOf(watch("newPassword") ?? "")];

  const onSubmitPassword = handleSubmit(async (values) => {
    try {
      await updatePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      success("Password changed");
    } catch (e) {
      toastError(apiError(e, "Could not change password"));
    }
  });

  return (
    <Panel
      id="account"
      title="Account & security"
      subtitle="Manage how you sign in and stay reachable."
    >
      <PanelBody>
        {/* Email */}
        <Field label="Email address" htmlFor="email">
          <div className="ws-input-row">
            <input
              id="email"
              type="email"
              className="ws-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {account.emailVerified ? (
              <span className="ws-verified">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <button
                type="button"
                className="ws-btn ws-btn-sm ws-btn-outline"
                onClick={onVerifyEmail}
                disabled={verifyEmail.isPending}
              >
                Verify email
              </button>
            )}
          </div>
        </Field>
        <div style={{ marginTop: -6, marginBottom: 16 }}>
          {email !== account.email && (
            <button
              type="button"
              className="ws-btn ws-btn-sm ws-btn-gold"
              onClick={saveEmail}
              disabled={updateEmail.isPending}
            >
              {updateEmail.isPending ? "Saving…" : "Save email"}
            </button>
          )}
        </div>

        {/* Phone */}
        <Field label="Phone number" htmlFor="phone">
          <div className="ws-input-row">
            <input
              id="phone"
              type="tel"
              className="ws-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {account.phoneVerified ? (
              <span className="ws-verified">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <button
                type="button"
                className="ws-btn ws-btn-sm ws-btn-outline"
                onClick={onVerifyPhone}
                disabled={verifyPhone.isPending}
              >
                Verify phone
              </button>
            )}
          </div>
        </Field>
        <div style={{ marginTop: -6 }}>
          {phone !== account.phone && (
            <button
              type="button"
              className="ws-btn ws-btn-sm ws-btn-gold"
              onClick={savePhone}
              disabled={updatePhone.isPending}
            >
              {updatePhone.isPending ? "Saving…" : "Save phone"}
            </button>
          )}
        </div>

        {/* Change password */}
        <form className="ws-section" onSubmit={onSubmitPassword}>
          <div className="ws-section-title">Change password</div>

          <Field
            label="Current password"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
          >
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className={`ws-input${errors.currentPassword ? " invalid" : ""}`}
              {...register("currentPassword")}
            />
          </Field>

          <div className="ws-grid2">
            <Field
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword?.message}
            >
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className={`ws-input${errors.newPassword ? " invalid" : ""}`}
                {...register("newPassword")}
              />
              {strength.cls && (
                <div className="ws-strength">
                  <div className="ws-strength-track">
                    <div
                      className={`ws-strength-fill ${strength.cls}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span className={`ws-strength-label ${strength.cls}`}>
                    {strength.label}
                  </span>
                </div>
              )}
            </Field>
            <Field
              label="Confirm new password"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
            >
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`ws-input${errors.confirmPassword ? " invalid" : ""}`}
                {...register("confirmPassword")}
              />
            </Field>
          </div>

          <div style={{ marginTop: 4 }}>
            <button
              type="submit"
              className="ws-btn ws-btn-sm ws-btn-gold"
              disabled={updatePassword.isPending || !isDirty}
            >
              {updatePassword.isPending ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>

        {/* Google */}
        <div className="ws-section">
          <div className="ws-section-title">Google account</div>
          <div className="ws-connected">
            {account.googleConnected ? (
              <>
                <span className="ws-connected-text">
                  Connected as{" "}
                  <strong>{account.googleEmail ?? account.email}</strong>
                </span>
                <button
                  type="button"
                  className="ws-btn ws-btn-sm ws-btn-outline"
                  onClick={onDisconnectGoogle}
                  disabled={disconnectGoogle.isPending}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <span className="ws-connected-text">
                  Connect your Google account for faster sign-in.
                </span>
                <a
                  className="ws-btn ws-btn-sm ws-btn-outline"
                  href="/api/auth/signin/google"
                >
                  Connect Google
                </a>
              </>
            )}
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
