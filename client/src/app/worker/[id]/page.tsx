"use client";

import { useParams, usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import WorkerProfile from "@/components/worker/WorkerProfile";
import WorkerProfileSkeleton from "@/components/worker/WorkerProfileSkeleton";
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

export default function PublicWorkerProfilePage() {
  const pathname = usePathname();
  const params = useParams();
  const id = String(params?.id ?? MOCK_PROFILE.id);
  const { profile } = useAuth();
  const query = useGetProfile(id);

  // Public worker profile (employer view). Falls back to MOCK_PROFILE on failure.
  const data: WorkerProfileData | null = query.isLoading
    ? null
    : ((query.data as WorkerProfileData | undefined) ?? { ...MOCK_PROFILE, id });

  // Chrome shows the signed-in viewer (an employer); content is the viewed worker.
  const viewerName = profile?.fullName ?? "Employer";
  const viewer = { name: viewerName, initials: initialsOf(viewerName) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={viewer} currentPath={pathname}>
      {data ? (
        <WorkerProfile mode="public" initialData={data} />
      ) : (
        <WorkerProfileSkeleton />
      )}
    </Shell>
  );
}
