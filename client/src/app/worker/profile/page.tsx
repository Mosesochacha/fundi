"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import WorkerProfile from "@/components/worker/WorkerProfile";
import {
  MOCK_PROFILE,
  type WorkerProfileData,
} from "@/components/worker/workerProfileData";
import { useAuth } from "@/features/auth";
import { useGetProfile } from "@/features/worker/profile";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

export default function WorkerProfilePage() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const query = useGetProfile("me");

  // Load the signed-in worker's CV. Falls back to MOCK_PROFILE when not signed
  // in / the request fails, so the page is always reviewable.
  const data: WorkerProfileData | null = query.isLoading
    ? null
    : ((query.data as WorkerProfileData | undefined) ?? MOCK_PROFILE);

  const name = profile?.fullName ?? MOCK_PROFILE.name;
  const shellUser = {
    name,
    initials: initialsOf(name),
    isVerified: data?.isVerified ?? true,
    isAvailable: data?.isAvailable ?? true,
  };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell
      role="worker"
      user={shellUser}
      currentPath={pathname}
      unreadMessages={2}
      unreadRequests={3}
    >
      {data ? (
        <WorkerProfile mode="own" initialData={data} />
      ) : (
        <div className="p-6 text-ink-3 text-sm">Loading…</div>
      )}
    </Shell>
  );
}
