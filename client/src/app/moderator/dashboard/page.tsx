"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import { useAuth } from "@/features/auth";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

export default function ModeratorDashboardPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Moderator";

  const shellUser = { name, initials: initialsOf(name) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="moderator" user={shellUser} currentPath={pathname}>
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1c1410" }}>
          Moderator dashboard
        </h1>
        <p style={{ marginTop: 8, color: "#8a8a85", fontSize: 14 }}>
          The moderator dashboard is coming soon.
        </p>
      </div>
    </Shell>
  );
}
