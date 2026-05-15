"use client";

import Link from "next/link";
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

const EnvelopeIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <rect width="80" height="80" rx="20" fill="#fff7ed" />
    <path
      d="M16 28C16 25.8 17.8 24 20 24H60C62.2 24 64 25.8 64 28V52C64 54.2 62.2 56 60 56H20C17.8 56 16 54.2 16 52V28Z"
      stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round"
    />
    <path d="M16 28L40 44L64 28" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();
  const { error: toastError } = useToastContext();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      await forgotPassword({ email: data.email.trim().toLowerCase() }).unwrap();
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
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-7"
          >
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

            <p className="text-center text-[14px] font-dm-sans">
              <Link href="/login" className="text-gray-500 hover:text-gray-700 transition-colors">
                ← Back to login
              </Link>
            </p>
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
              <EnvelopeIcon />
            </motion.div>
            <div>
              <h1 className="text-[28px] font-bold text-gray-900 font-playfair leading-tight">
                Check your email
              </h1>
              <p className="text-[15px] text-gray-600 mt-3 font-dm-sans leading-relaxed">
                We sent a reset link to{" "}
                <span className="font-semibold text-gray-800">{getValues("email")}</span>.
                Click the link in the email to set a new password.
              </p>
            </div>
            <p className="text-[13px] text-gray-400 italic font-dm-sans">
              Check your spam folder if you don't see it within 2 minutes.
            </p>
            <p className="text-[13px] text-gray-500 font-dm-sans">
              <Link href="/login" className="hover:text-gray-600 transition-colors">
                ← Back to login
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
