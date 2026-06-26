"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import HireModal from "@/app/employer/dashboard/HireModal";
import type { DashboardRole } from "@/components/dashboard/navConfig";
import Shell from "@/components/dashboard/Shell";
import PublicWorkerProfile from "@/components/worker/PublicWorkerProfile";
import WorkerProfile from "@/components/worker/WorkerProfile";
import WorkerProfileSkeleton from "@/components/worker/WorkerProfileSkeleton";
import type { WorkerProfileData } from "@/components/worker/workerProfileData";
import { useAuth } from "@/features/auth";
import { useConversations } from "@/features/messages/hooks/useConversations";
import { useGetProfile } from "@/features/worker/profile";
import type { PublicWorkerData } from "@/lib/publicProfile";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

/**
 * Decides which profile experience to render:
 *  • Logged-out visitors (and crawlers / SSR) → the public, minimal profile
 *    built from server-fetched `initial` data.
 *  • Signed-in viewers → the full interactive profile inside the dashboard Shell,
 *    fetched with their auth token (richer payload + Hire/Message actions).
 */
export default function WorkerProfileGate({
  id,
  initial,
}: {
  id: string;
  initial: PublicWorkerData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoggedIn, role } = useAuth();
  const query = useGetProfile(isLoggedIn ? id : undefined);
  const { data: conversations } = useConversations();

  const [hireTarget, setHireTarget] = useState<{
    id: string;
    name: string;
    trade: string;
  } | null>(null);

  if (!isLoggedIn) {
    return <PublicWorkerProfile data={initial} />;
  }

  const data = query.data as WorkerProfileData | undefined;

  const viewerName = profile?.fullName ?? "";
  const viewer = { name: viewerName, initials: initialsOf(viewerName) };
  const shellRole: DashboardRole = role === "worker" ? "worker" : "employer";
  const unreadMessages =
    conversations?.filter((c) => c.unreadCount > 0).length ?? 0;

  const onMessage = () => {
    if (!data) return;
    const base =
      role === "employer" ? "/employer/messages" : "/worker/messages";
    router.push(`${base}?to=${data.id}&name=${encodeURIComponent(data.name)}`);
  };

  const onHire = () => {
    if (!data) return;
    setHireTarget({ id: data.id, name: data.name, trade: data.trade });
  };

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
