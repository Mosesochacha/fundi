"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import HireModal from "@/app/employer/dashboard/HireModal";
import type { DashboardRole } from "@/components/dashboard/navConfig";
import Shell from "@/components/dashboard/Shell";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
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
 * Renders the same rich worker profile to everyone — the experience is seamless
 * across auth state:
 *  • Logged-out visitors (and crawlers / SSR) → the full profile from
 *    server-fetched `initial` data, in public chrome (nav + footer). The
 *    Message/Hire actions redirect to login and return to this profile after.
 *  • Signed-in viewers → the same profile inside the dashboard Shell, fetched
 *    with their auth token, with live Message/Hire actions.
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
    const toLogin = () =>
      router.push(
        `/login?next=${encodeURIComponent(`/worker/${initial.username || id}`)}`,
      );
    return (
      <div className="min-h-screen bg-cream text-ink font-sans">
        <LandingNav />
        <main className="mx-auto max-w-[1080px] px-5 pb-24 pt-[96px] md:pt-[120px]">
          <WorkerProfile
            mode="public"
            initialData={initial}
            onMessage={toLogin}
            onHire={toLogin}
          />
        </main>
        <LandingFooter />
      </div>
    );
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
