"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useForgotPasswordMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import FormInput from "@/components/auth/FormInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

const CheckIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <rect width="48" height="48" rx="12" fill="#fff7ed" />
    <path
      d="M14 24l8 8 12-16"
      stroke="#f97316"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const { error: toastError } = useToastContext();

  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [countdown, setCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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

  const onSubmit = async (data: FormValues) => {
    try {
      await forgotPassword({ email: data.email.trim().toLowerCase() }).unwrap();
      setSubmittedEmail(data.email.trim());
      setSent(true);
      startCountdown();
    } catch {
      toastError("Something went wrong. Please try again.");
    }
  };

  const handleResend = async () => {
    try {
      await forgotPassword({ email: submittedEmail.trim().toLowerCase() }).unwrap();
      startCountdown();
    } catch {
      toastError("Something went wrong. Please try again.");
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
        className="bg-white border border-gray-100 rounded-2xl p-8"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <Link
                href="/login"
                className="inline-block font-dm-sans text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to sign in
              </Link>

              <PageHeader
                title="Reset your password"
                subtitle="Enter your email and we'll send you a reset link"
              />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormInput
                  label="Email address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Button type="submit" variant="primary" fullWidth loading={isLoading}>
                  Send reset link
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex justify-center"
              >
                <CheckIcon />
              </motion.div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-playfair leading-tight">
                  Check your email
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-dm-sans leading-relaxed">
                  We sent a reset link to{" "}
                  <span className="font-semibold text-gray-700">{submittedEmail}</span>.
                  <br />
                  Click the link to reset your password.
                </p>
              </div>

              <div className="font-dm-sans text-sm text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Resend email
                  </button>
                ) : (
                  <span className="text-gray-400">Resend in {countdown}s</span>
                )}
              </div>

              <Link
                href="/login"
                className="block font-dm-sans text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to sign in
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Note below card */}
      {sent && (
        <p className="mt-4 text-center font-dm-sans text-xs text-gray-300 italic">
          Check your spam folder if you don't see it within 2 minutes.
        </p>
      )}
    </motion.div>
  );
}
