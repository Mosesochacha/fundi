"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Shell from "@/components/dashboard/Shell";
import { initialsOf, useAdminBadges } from "@/features/admin";
import { useAuth } from "@/features/auth";

/**
 * Wraps every admin page in the shared dashboard Shell with role="admin",
 * wiring the live report/payout badge counts so individual pages don't repeat
 * the boilerplate.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const { data: badges } = useAdminBadges();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Admin";
  const shellUser = { name, initials: initialsOf(name) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell
      role="admin"
      user={shellUser}
      currentPath={pathname}
      openReports={badges?.openReports}
      pendingPayouts={badges?.pendingPayouts}
    >
      {children}
    </Shell>
  );
}
