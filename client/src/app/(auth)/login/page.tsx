"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials, type AuthUser, type AuthProfile } from "@/store/authSlice";
import { useLoginMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import AuthLink from "@/components/ui/AuthLink";

const ATTEMPTS_KEY = "fundi_login_attempts";
const LOCKED_KEY = "fundi_login_locked_until";
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 5 * 60 * 1000;

function getRemainingLockSeconds(): number {
  if (typeof window === "undefined") return 0;
  const until = Number(localStorage.getItem(LOCKED_KEY) ?? 0);
  const remaining = Math.ceil((until - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const { error: toastError, success, warning } = useToastContext();

  const [hasError, setHasError] = useState(false);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    const remaining = getRemainingLockSeconds();
    if (remaining > 0) setLockSecondsLeft(remaining);
    const interval = setInterval(() => {
      const r = getRemainingLockSeconds();
      setLockSecondsLeft(r);
      if (r === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    if (lockSecondsLeft > 0) return;
    try {
      const res = await login({ email: data.email.trim(), password: data.password }).unwrap();
      const { user, profile, tokens } = (res as { data: { user: AuthUser; profile: AuthProfile | null; tokens: { accessToken: string } } }).data;
      dispatch(setCredentials({ user, profile, accessToken: tokens.accessToken }));
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKED_KEY);
      if (!user.isOnboarded) {
        router.push("/setup");
      } else {
        success("Welcome back! Taking you to your feed...");
        router.push("/feed");
      }
    } catch (err) {
      const status = (err as { status?: number })?.status;

      // Server/network errors are not the user's fault — don't count as failed attempts
      if (!status || status >= 500) {
        setHasError(true);
        setTimeout(() => setHasError(false), 500);
        toastError(
          status
            ? "Something went wrong on our end. Please try again in a moment."
            : "Connection error. Please check your internet."
        );
        return;
      }

      setHasError(true);
      setTimeout(() => setHasError(false), 500);

      // Only count 401/403 as failed login attempts
      const attempts = (Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0)) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));

      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = Date.now() + LOCK_DURATION_MS;
        localStorage.setItem(LOCKED_KEY, String(lockedUntil));
        setLockSecondsLeft(Math.ceil(LOCK_DURATION_MS / 1000));
        toastError("Too many failed attempts. Please wait 5 minutes.");
        return;
      }

      const remaining = MAX_ATTEMPTS - attempts;
      if (remaining <= 2) {
        warning(`${remaining} attempt${remaining === 1 ? "" : "s"} remaining before temporary lockout.`);
      }

      if (status === 401) {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "";
        if (msg.toLowerCase().includes("verify")) {
          setUnverifiedEmail(data.email.trim().toLowerCase());
        } else {
          setUnverifiedEmail(null);
          toastError("Incorrect email or password. Please try again.");
        }
      } else if (status === 429) {
        toastError("Too many attempts. Please wait a few minutes.");
      } else {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "";
        toastError(msg || "Something went wrong. Please try again.");
      }
    }
  };

  const formatLock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-7"
    >
      <PageHeader title="Welcome back" subtitle="Sign in to your Fundi account" />

      {lockSecondsLeft > 0 && (
        <div className="bg-coral-lt border border-coral/30 rounded-xl px-4 py-3 text-sm text-gray-700 font-dm-sans">
          Account locked. Try again in{" "}
          <span className="font-semibold text-coral">{formatLock(lockSecondsLeft)}</span>
        </div>
      )}

      {unverifiedEmail && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-4 space-y-2">
          <p className="text-[13px] font-semibold text-orange-700 font-dm-sans">Email not verified</p>
          <p className="text-[13px] text-orange-600 font-dm-sans leading-relaxed">
            Check your inbox for the 6-digit verification code we sent when you registered.
          </p>
          <Link
            href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
            className="inline-block text-[13px] font-semibold font-dm-sans underline underline-offset-2"
            style={{ color: "var(--orange-500)" }}
          >
            Enter verification code →
          </Link>
        </div>
      )}

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        animate={hasError ? { x: [0, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="space-y-4"
        noValidate
      >
        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="you@example.com"
          error={errors.email?.message}
          disabled={lockSecondsLeft > 0}
          {...register("email")}
        />

        <div className="space-y-1">
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message}
            disabled={lockSecondsLeft > 0}
            watchValue={watch("password")}
            {...register("password")}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[13px] font-dm-sans font-medium"
              style={{ color: "var(--orange-500)" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={lockSecondsLeft > 0}
        >
          Sign in
        </Button>
      </motion.form>

      <AuthLink question="Don't have an account?" linkText="Create one free" href="/register" />
    </motion.div>
  );
}
