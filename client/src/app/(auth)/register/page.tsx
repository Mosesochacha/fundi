"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { useRegisterMutation } from "@/store/apiSlice";
import { useToastContext } from "@/context/ToastContext";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import FormInput from "@/components/auth/FormInput";
import PasswordInput from "@/components/auth/PasswordInput";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import AuthLink from "@/components/ui/AuthLink";
import FieldError from "@/components/ui/FieldError";

const PROFESSIONS = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Mason",
  "Welder", "Mechanic", "Tailor", "Chef", "Cleaner",
  "Landscaper", "Tiler", "Roofing", "AC Tech", "Other",
];

const STEP1_FIELDS = ["firstName", "lastName", "email", "password", "confirmPassword"] as const;
const STEP2_FIELDS = ["username", "location", "profession", "termsAccepted", "ageConfirmed"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const { error: toastError, success } = useToastContext();

  const [step, setStep] = useState(1);
  const [hasError, setHasError] = useState(false);

  const {
    register: field,
    handleSubmit,
    watch,
    trigger,
    control,
    formState: { errors, touchedFields, dirtyFields },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema), mode: "onTouched" });

  const watchPassword = watch("password") ?? "";
  const watchConfirmPassword = watch("confirmPassword") ?? "";
  const passwordsMatch = watchPassword === watchConfirmPassword && watchPassword.length > 0;

  const shake = () => {
    setHasError(true);
    setTimeout(() => setHasError(false), 500);
  };

  const goToStep2 = async () => {
    const valid = await trigger(STEP1_FIELDS);
    if (!valid || !passwordsMatch) { shake(); return; }
    setStep(2);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await register({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        username: data.username.trim(),
        location: data.location.trim(),
        profession: data.profession,
        termsAccepted: data.termsAccepted,
        ageConfirmed: data.ageConfirmed,
      }).unwrap();

      success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      shake();
      toastError(err?.data?.message || "Registration failed. Please try again.");
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
        title="Create your profile"
        subtitle="Join thousands of professionals on Fundi"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: s <= step ? "var(--orange-500)" : "#E5E7EB" }}
          />
        ))}
      </div>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        animate={hasError ? { x: [0, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        noValidate
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <FormInput
                  label="First name"
                  type="text"
                  autoComplete="given-name"
                  enterKeyHint="next"
                  placeholder="John"
                  error={errors.firstName?.message}
                  isSuccess={!errors.firstName && !!touchedFields.firstName && !!dirtyFields.firstName}
                  {...field("firstName")}
                />
                <FormInput
                  label="Last name"
                  type="text"
                  autoComplete="family-name"
                  enterKeyHint="next"
                  placeholder="Kamau"
                  error={errors.lastName?.message}
                  isSuccess={!errors.lastName && !!touchedFields.lastName && !!dirtyFields.lastName}
                  {...field("lastName")}
                />
              </div>
              <FormInput
                label="Email address"
                type="email"
                autoComplete="email"
                inputMode="email"
                enterKeyHint="next"
                placeholder="you@example.com"
                error={errors.email?.message}
                isSuccess={!errors.email && !!touchedFields.email && !!dirtyFields.email}
                {...field("email")}
              />
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password?.message}
                showStrength
                watchValue={watchPassword}
                {...field("password")}
              />
              <PasswordInput
                label="Confirm password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                isSuccess={passwordsMatch && !errors.confirmPassword}
                {...field("confirmPassword")}
              />

              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={goToStep2}
                className="mt-2"
              >
                Next →
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <FormInput
                label="Username"
                type="text"
                autoComplete="username"
                enterKeyHint="next"
                placeholder="johnkamau"
                error={errors.username?.message}
                isSuccess={!errors.username && !!touchedFields.username && !!dirtyFields.username}
                {...field("username")}
              />
              <FormInput
                label="Location"
                type="text"
                enterKeyHint="next"
                placeholder="Westlands, Nairobi"
                error={errors.location?.message}
                isSuccess={!errors.location && !!touchedFields.location && !!dirtyFields.location}
                {...field("location")}
              />

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-gray-600 font-dm-sans">
                  Profession
                </label>
                <Controller
                  name="profession"
                  control={control}
                  render={({ field: profField }) => (
                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Select your profession">
                      {PROFESSIONS.map((p) => {
                        const selected = profField.value === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => profField.onChange(p)}
                            aria-pressed={selected}
                            className="h-[40px] px-2 rounded-[8px] border-[1.5px] text-[13px] font-dm-sans font-medium transition-all duration-150 active:scale-[0.97] truncate"
                            style={{
                              borderColor: selected ? "var(--orange-500)" : "#E5E7EB",
                              background:  selected ? "var(--orange-50)"  : "white",
                              color:       selected ? "var(--orange-700)" : "#374151",
                              boxShadow:   selected ? "0 0 0 3px rgba(249,115,22,0.12)" : undefined,
                            }}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                <FieldError error={errors.profession?.message} />
              </div>

              {/* Consent checkboxes */}
              <div className="space-y-3 pt-1">
                <Controller
                  name="ageConfirmed"
                  control={control}
                  render={({ field: f }) => (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!f.value}
                        onChange={(e) => f.onChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-[13px] text-gray-600 font-dm-sans leading-snug">
                        I confirm I am 18 years of age or older
                      </span>
                    </label>
                  )}
                />
                <FieldError error={errors.ageConfirmed?.message} />

                <Controller
                  name="termsAccepted"
                  control={control}
                  render={({ field: f }) => (
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!f.value}
                        onChange={(e) => f.onChange(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-orange-500 cursor-pointer"
                      />
                      <span className="text-[13px] text-gray-600 font-dm-sans leading-snug">
                        I agree to the{" "}
                        <a href="/terms" className="text-orange-600 underline">Terms & Conditions</a>
                        {" "}and{" "}
                        <a href="/privacy" className="text-orange-600 underline">Privacy Policy</a>
                      </span>
                    </label>
                  )}
                />
                <FieldError error={errors.termsAccepted?.message} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button type="submit" variant="coral" loading={isLoading} className="flex-1">
                  Create my free account
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <Lock size={12} strokeWidth={2} color="#9CA3AF" />
                <span className="text-[12px] text-gray-400 font-dm-sans">
                  Free to join · No credit card · Your data stays private
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <AuthLink question="Already have an account?" linkText="Sign in" href="/login" />
    </motion.div>
  );
}
