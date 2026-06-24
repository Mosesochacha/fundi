"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import HireModal from "@/app/employer/dashboard/HireModal";
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
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? MOCK_PROFILE.id);
  const { profile, isLoggedIn, role } = useAuth();
  const query = useGetProfile(id);

  const [hireTarget, setHireTarget] = useState<{
    id: string;
    name: string;
    trade: string;
  } | null>(null);

  // Public worker profile (employer view). Falls back to MOCK_PROFILE on failure.
  const data: WorkerProfileData | null = query.isLoading
    ? null
    : ((query.data as WorkerProfileData | undefined) ?? {
        ...MOCK_PROFILE,
        id,
      });

  // Chrome shows the signed-in viewer (an employer); content is the viewed worker.
  const viewerName = profile?.fullName ?? "Employer";
  const viewer = { name: viewerName, initials: initialsOf(viewerName) };

  const requireAuth = (fn: () => void) => {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/worker/${id}`)}`);
      return;
    }
    fn();
  };

  const onMessage = () =>
    requireAuth(() => {
      if (!data) return;
      const base =
        role === "employer" ? "/employer/messages" : "/worker/messages";
      router.push(
        `${base}?to=${data.id}&name=${encodeURIComponent(data.name)}`,
      );
    });

  const onHire = () =>
    requireAuth(() => {
      if (!data) return;
      setHireTarget({ id: data.id, name: data.name, trade: data.trade });
    });

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={viewer} currentPath={pathname}>
      {data ? (
        <WorkerProfile
          mode="public"
          initialData={data}
          onMessage={onMessage}
          onHire={onHire}
        />
      ) : (
        <WorkerProfileSkeleton />
      )}

      <HireModal
        worker={hireTarget}
        defaultLocation={profile?.location ?? ""}
        onClose={() => setHireTarget(null)}
      />
    </Shell>
  );
}
