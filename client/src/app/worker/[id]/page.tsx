"use client";

import { notFound, useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import HireModal from "@/app/employer/dashboard/HireModal";
import type { DashboardRole } from "@/components/dashboard/navConfig";
import Shell from "@/components/dashboard/Shell";
import WorkerProfile from "@/components/worker/WorkerProfile";
import WorkerProfileSkeleton from "@/components/worker/WorkerProfileSkeleton";
import type { WorkerProfileData } from "@/components/worker/workerProfileData";
import { useAuth } from "@/features/auth";
import { useConversations } from "@/features/messages/hooks/useConversations";
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
  const id = String(params?.id ?? "");
  const { profile, isLoggedIn, role } = useAuth();
  const query = useGetProfile(id);
  const { data: conversations } = useConversations();

  const [hireTarget, setHireTarget] = useState<{
    id: string;
    name: string;
    trade: string;
  } | null>(null);

  const data = query.data as WorkerProfileData | undefined;

  // Middleware guarantees a signed-in viewer here; an unknown/failed profile 404s.
  if (!query.isLoading && (query.isError || !data)) notFound();

  // Chrome reflects the signed-in viewer (employer or worker); content is the
  // viewed worker.
  const viewerName = profile?.fullName ?? "";
  const viewer = { name: viewerName, initials: initialsOf(viewerName) };
  const shellRole: DashboardRole = role === "worker" ? "worker" : "employer";
  const unreadMessages =
    conversations?.filter((c) => c.unreadCount > 0).length ?? 0;

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
    <Shell
      role={shellRole}
      user={viewer}
      currentPath={pathname}
      unreadMessages={unreadMessages}
    >
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
