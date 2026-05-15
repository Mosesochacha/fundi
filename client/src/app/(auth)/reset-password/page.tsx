"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useResetPasswordMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const { success, error: toastError } = useToastContext();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await resetPassword({ token, newPassword: data.newPassword }).unwrap();
      success("Password reset! You can now sign in.");
      router.push("/login");
    } catch (err: any) {
      const msg = err?.data?.message ?? "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        toastError("This reset link is invalid or has expired. Request a new one.");
      } else {
        toastError(msg || "Something went wrong. Please try again.");
      }
    }
  };

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6 text-center"
      >
        <PageHeader
          title="Invalid link"
          subtitle="This password reset link is missing or malformed."
        />
        <Link
          href="/forgot-password"
          className="block w-full h-[52px] rounded-[10px] bg-[#f97316] text-white text-[15px] font-semibold font-dm-sans flex items-center justify-center"
        >
          Request a new link
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-7"
    >
      <PageHeader
        title="Set new password"
        subtitle="Choose a strong password for your account"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          Reset password
        </Button>
      </form>

      <p className="text-center text-[13px] text-gray-400 font-dm-sans">
        <Link href="/login" className="hover:text-gray-600 transition-colors">
          ← Back to login
        </Link>
      </p>
    </motion.div>
  );
}
