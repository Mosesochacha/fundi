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
import { cn } from "@/lib/utils";
import {
  apiError,
  BTN_GOLD,
  BTN_OUTLINE,
  btn,
  FIELD_INPUT,
  Field,
  Panel,
  PanelBody,
} from "../_components/ui";

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
  { label: "", fill: "", text: "", width: "0%" },
  { label: "Weak", fill: "bg-red-600", text: "text-red-600", width: "33%" },
  { label: "Fair", fill: "bg-amber-600", text: "text-amber-600", width: "66%" },
  {
    label: "Strong",
    fill: "bg-green-600",
    text: "text-green-600",
    width: "100%",
  },
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
          <div className="flex items-center gap-2.5">
            <input
              id="email"
              type="email"
              className={cn(FIELD_INPUT, "flex-1")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {account.emailVerified ? (
              <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-gold-dark bg-gold-light border border-gold/40 rounded-[20px] py-1 px-2.5">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <button
                type="button"
                className={btn(BTN_OUTLINE, true)}
                onClick={onVerifyEmail}
                disabled={verifyEmail.isPending}
              >
                Verify email
              </button>
            )}
          </div>
        </Field>
        <div className="-mt-1.5 mb-4">
          {email !== account.email && (
            <button
              type="button"
              className={btn(BTN_GOLD, true)}
              onClick={saveEmail}
              disabled={updateEmail.isPending}
            >
              {updateEmail.isPending ? "Saving…" : "Save email"}
            </button>
          )}
        </div>

        {/* Phone */}
        <Field label="Phone number" htmlFor="phone">
          <div className="flex items-center gap-2.5">
            <input
              id="phone"
              type="tel"
              className={cn(FIELD_INPUT, "flex-1")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {account.phoneVerified ? (
              <span className="inline-flex items-center gap-1 shrink-0 text-[11px] font-semibold text-gold-dark bg-gold-light border border-gold/40 rounded-[20px] py-1 px-2.5">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <button
                type="button"
                className={btn(BTN_OUTLINE, true)}
                onClick={onVerifyPhone}
                disabled={verifyPhone.isPending}
              >
                Verify phone
              </button>
            )}
          </div>
        </Field>
        <div className="-mt-1.5">
          {phone !== account.phone && (
            <button
              type="button"
              className={btn(BTN_GOLD, true)}
              onClick={savePhone}
              disabled={updatePhone.isPending}
            >
              {updatePhone.isPending ? "Saving…" : "Save phone"}
            </button>
          )}
        </div>

        {/* Change password */}
        <form
          className="pt-4 mt-4 border-t-[0.5px] border-border"
          onSubmit={onSubmitPassword}
        >
          <div className="text-sm font-medium text-ink mb-3.5">
            Change password
          </div>

          <Field
            label="Current password"
            htmlFor="currentPassword"
            error={errors.currentPassword?.message}
          >
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className={cn(
                FIELD_INPUT,
                errors.currentPassword && "border-red-600",
              )}
              {...register("currentPassword")}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword?.message}
            >
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className={cn(
                  FIELD_INPUT,
                  errors.newPassword && "border-red-600",
                )}
                {...register("newPassword")}
              />
              {strength.fill && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-[5px] rounded-[20px] bg-cream-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-[20px] transition-[width,background-color] duration-[250ms]",
                        strength.fill,
                      )}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold w-11 text-right",
                      strength.text,
                    )}
                  >
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
                className={cn(
                  FIELD_INPUT,
                  errors.confirmPassword && "border-red-600",
                )}
                {...register("confirmPassword")}
              />
            </Field>
          </div>

          <div className="mt-1">
            <button
              type="submit"
              className={btn(BTN_GOLD, true)}
              disabled={updatePassword.isPending || !isDirty}
            >
              {updatePassword.isPending ? "Saving…" : "Update password"}
            </button>
          </div>
        </form>

        {/* Google */}
        <div className="pt-4 mt-4 border-t-[0.5px] border-border">
          <div className="text-sm font-medium text-ink mb-3.5">
            Google account
          </div>
          <div className="flex items-center justify-between gap-3">
            {account.googleConnected ? (
              <>
                <span className="text-[13px] text-ink-2">
                  Connected as{" "}
                  <strong className="text-ink font-medium">
                    {account.googleEmail ?? account.email}
                  </strong>
                </span>
                <button
                  type="button"
                  className={btn(BTN_OUTLINE, true)}
                  onClick={onDisconnectGoogle}
                  disabled={disconnectGoogle.isPending}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <span className="text-[13px] text-ink-2">
                  Connect your Google account for faster sign-in.
                </span>
                <a
                  className={btn(BTN_OUTLINE, true)}
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
