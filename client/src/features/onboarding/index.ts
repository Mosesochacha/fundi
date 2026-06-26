import { useMutation, useQueryClient } from "@tanstack/react-query";
import client from "@/lib/axios";

export interface WorkerOnboardingInput {
  /** One or more selected trades; the first is the primary profession. */
  trades: string[];
  location: string;
  dailyRate?: number;
  /** Preferred display currency (ISO 4217 code, e.g. "KES"). */
  currency?: string;
  /** Display symbol for that currency (e.g. "KSh"). */
  currencySymbol?: string;
}
export interface EmployerOnboardingInput {
  location: string;
  interestedTrades?: string[];
  /** Preferred display currency (ISO 4217 code, e.g. "KES"). */
  currency?: string;
  currencySymbol?: string;
}

export const onboardingService = {
  worker: (data: WorkerOnboardingInput) =>
    client.patch("/worker/onboarding", data),
  employer: (data: EmployerOnboardingInput) =>
    client.patch("/employer/onboarding", data),
};

/** Invalidate the cached current-user so the onboarding guard sees the fresh
 *  isProfileComplete=true immediately (await so callers can redirect after). */
const refreshMe = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["auth", "me"] });

export function useWorkerOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkerOnboardingInput) => onboardingService.worker(data),
    onSuccess: () => refreshMe(qc),
  });
}

export function useEmployerOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployerOnboardingInput) =>
      onboardingService.employer(data),
    onSuccess: () => refreshMe(qc),
  });
}
