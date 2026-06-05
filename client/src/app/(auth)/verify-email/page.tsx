"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormInput from "@/components/auth/FormInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useToastContext } from "@/context/ToastContext";
import { useResendVerification, useVerifyEmail } from "@/features/auth";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});
type FormValues = z.infer<typeof schema>;

const EnvelopeIcon = () => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    aria-hidden="true"
  >
    <rect width="52" height="52" rx="14" fill="#fff7ed" />
    <path
      d="M10 19C10 17.3 11.3 16 13 16H39C40.7 16 42 17.3 42 19V33C42 34.7 40.7 36 39 36H13C11.3 36 10 34.7 10 33V19Z"
      stroke="#f97316"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M10 19L26 28L42 19"
      stroke="#f97316"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  // Where to land after verifying — the role-based dashboard. Middleware sends
  // the (still unauthenticated) user through /login first, then on here.
  const accountType = searchParams.get("accountType");
  const dashboardPath =
    accountType === "employer" ? "/employer/dashboard" : "/worker/dashboard";

  const verifyEmailMutation = useVerifyEmail();
  const isLoading = verifyEmailMutation.isPending;
  const resendVerificationMutation = useResendVerification();
  const isResending = resendVerificationMutation.isPending;
  const { success, error: toastError } = useToastContext();

  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCountdown(45);
    setCanResend(false);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Start resend countdown on mount
  useEffect(() => {
    startCountdown();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startCountdown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    if (!email) {
      toastError("Missing email. Please register again.");
      return;
    }
    try {
      await verifyEmailMutation.mutateAsync({ email, code: data.code });
      posthog.capture("email_verified");
      success("Email verified! You can now sign in.");
      router.push(dashboardPath);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "";
      if (
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid")
      ) {
        toastError("That code is invalid or expired. Request a new one below.");
      } else if (msg.toLowerCase().includes("attempts")) {
        toastError("Too many attempts. Please request a new code.");
      } else {
        toastError(msg || "Verification failed. Please try again.");
      }
    }
  };

  const handleResend = async () => {
    if (!email) return;
    try {
      await resendVerificationMutation.mutateAsync({ email });
      startCountdown();
      success("A new code has been sent to your email.");
    } catch (err: any) {
      toastError(
        err?.response?.data?.message || "Could not resend. Please try again.",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* White card */}
      <div
        className="bg-white border border-gray-100 rounded-2xl p-8 space-y-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {/* Envelope icon */}
        <div className="flex justify-center">
          <EnvelopeIcon />
        </div>

        <PageHeader
          title="Verify your email"
          subtitle={
            email
              ? `We sent a 6-digit code to ${email}`
              : "Enter the 6-digit code we sent to your email"
          }
        />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormInput
            label="6-digit code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            error={errors.code?.message}
            {...register("code")}
          />

          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            Verify email
          </Button>
        </form>

        {/* Resend section */}
        <div className="text-center font-dm-sans text-sm">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-orange-500 hover:text-orange-600 font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend code"}
            </button>
          ) : (
            <span className="text-gray-400">Resend code in {countdown}s</span>
          )}
        </div>
      </div>

      {/* Below card */}
      <p className="mt-4 text-center font-dm-sans text-xs text-gray-300 italic">
        Check your spam folder if you don't see it.
      </p>
      <div className="mt-3 text-center font-dm-sans text-base text-gray-400">
        <Link
          href="/register"
          className="hover:text-gray-600 transition-colors"
        >
          ← Wrong email? Back to register
        </Link>
      </div>
    </motion.div>
  );
}
