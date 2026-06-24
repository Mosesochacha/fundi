"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import WorkerProfile from "@/components/worker/WorkerProfile";
import type { WorkerProfileData } from "@/components/worker/workerProfileData";
import { useAuth } from "@/features/auth";
import { useConversations } from "@/features/messages/hooks/useConversations";
import { useGetProfile } from "@/features/worker/profile";
import { useGetRequestStats } from "@/features/worker/requests";

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
  const { data: stats } = useGetRequestStats();
  const { data: conversations } = useConversations();

  // The signed-in worker's own CV.
  const data: WorkerProfileData | null = query.isLoading
    ? null
    : ((query.data as WorkerProfileData | undefined) ?? null);

  const name = profile?.fullName ?? "";
  const shellUser = {
    name,
    initials: initialsOf(name),
    isVerified: data?.isVerified ?? false,
    isAvailable: data?.isAvailable ?? false,
  };

  // Real unread badges (hidden when zero by the Shell).
  const unreadMessages =
    conversations?.filter((c) => c.unreadCount > 0).length ?? 0;
  const unreadRequests = stats?.new ?? 0;

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell
      role="worker"
      user={shellUser}
      currentPath={pathname}
      unreadMessages={unreadMessages}
      unreadRequests={unreadRequests}
    >
      {data ? (
        <WorkerProfile mode="own" initialData={data} />
      ) : (
        <div className="p-6 text-ink-3 text-sm">Loading…</div>
      )}
    </Shell>
  );
}
