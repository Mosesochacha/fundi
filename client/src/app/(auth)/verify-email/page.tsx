"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import posthog from "posthog-js";
import { useVerifyEmailMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import FormInput from "@/components/auth/FormInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});
type FormValues = z.infer<typeof schema>;

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const { success, error: toastError } = useToastContext();

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
      await verifyEmail({ email, code: data.code }).unwrap();
      posthog.capture("email_verified");
      success("Email verified! You can now sign in.");
      router.push("/login");
    } catch (err: any) {
      const msg = err?.data?.message ?? "";
      if (msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("invalid")) {
        toastError("That code is invalid or expired. Request a new one below.");
      } else if (msg.toLowerCase().includes("attempts")) {
        toastError("Too many attempts. Please request a new code.");
      } else {
        toastError(msg || "Verification failed. Please try again.");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-7"
    >
      <PageHeader
        title="Verify your email"
        subtitle={
          email
            ? `We sent a 6-digit code to ${email}`
            : "Enter the 6-digit code we sent to your email"
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

      <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-4 space-y-2">
        <p className="text-[13px] font-semibold text-orange-700 font-dm-sans">
          This code expires in 10 minutes
        </p>
        <p className="text-[13px] text-orange-600 font-dm-sans leading-relaxed">
          If the code expires before you use it, go back to register and sign up again to receive a fresh code. Make sure to check your spam or junk folder — sometimes verification emails land there.
        </p>
      </div>

      <p className="text-center text-[13px] text-gray-400 font-dm-sans">
        <Link href="/register" className="hover:text-gray-600 transition-colors">
          ← Back to register
        </Link>
      </p>
    </motion.div>
  );
}
