"use client";

import { usePathname } from "next/navigation";
import Shell from "@/components/dashboard/Shell";
import SettingsView from "@/components/settings/SettingsView";
import { useAuth } from "@/features/auth";

const initialsOf = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "U";

export default function EmployerSettingsPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Employer";
  const shellUser = { name, initials: initialsOf(name) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="employer" user={shellUser} currentPath={pathname}>
      <SettingsView role="employer" />
    </Shell>
  );
}
