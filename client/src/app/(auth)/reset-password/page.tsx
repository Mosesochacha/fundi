"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui";
import { useToastContext } from "@/context/ToastContext";
import { useResetPassword } from "@/features/auth";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPasswordMutation = useResetPassword();
  const isLoading = resetPasswordMutation.isPending;
  const { success, error: toastError } = useToastContext();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: data.newPassword,
      });
      success("Password reset! You can now sign in.");
      router.push("/login");
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "";
      if (
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid")
      ) {
        toastError(
          "This reset link is invalid or has expired. Request a new one.",
        );
      } else {
        toastError(msg || "Something went wrong. Please try again.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* White card */}
      <div className="bg-white border border-border rounded-2xl p-8 shadow-[0_1px_3px_rgba(13,27,42,0.06)]">
        {!token ? (
          <div className="space-y-6 text-center">
            <div className="bg-gold-light border border-gold/30 rounded-xl p-6 space-y-3">
              <h1 className="text-xl font-medium text-navy font-serif">
                Link expired
              </h1>
              <p className="text-sm text-ink-3">
                This reset link has expired or already been used.
              </p>
            </div>
            <Link
              href="/forgot-password"
              className="block w-full h-12 rounded-xl border border-gold/40 text-gold-dark hover:bg-gold-light text-sm font-medium flex items-center justify-center transition-colors"
            >
              Request a new link →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-medium text-navy font-serif leading-tight tracking-tight">
                Set new password
              </h1>
              <p className="text-sm text-ink-3 mt-1">
                Choose a strong password for your account
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <PasswordInput
                label="New password"
                autoComplete="new-password"
                placeholder="••••••••"
                showStrength
                watchValue={watch("newPassword")}
                error={errors.newPassword?.message}
                {...register("newPassword")}
              />

              <PasswordInput
                label="Confirm new password"
                autoComplete="new-password"
                placeholder="••••••••"
                isSuccess={
                  !errors.confirmPassword &&
                  !!watch("confirmPassword") &&
                  watch("newPassword") === watch("confirmPassword")
                }
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Updating…" : "Update password"}
              </Button>
            </form>

            <p className="text-center text-sm text-ink-3">
              <Link
                href="/login"
                className="hover:text-ink-2 transition-colors"
              >
                ← Back to sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
