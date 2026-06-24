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

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const { profile, user } = useAuth();

  const name =
    profile?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Admin";

  const shellUser = { name, initials: initialsOf(name) };

  return (
    // biome-ignore lint/a11y/useValidAriaRole: `role` is a Shell prop, not an ARIA attribute
    <Shell role="admin" user={shellUser} currentPath={pathname}>
      <div className="p-6">
        <h1 className="font-serif text-[22px] font-bold text-ink">
          Admin dashboard
        </h1>
        <p className="mt-2 text-ink-3 text-sm">
          The admin dashboard is coming soon.
        </p>
      </div>
    </Shell>
  );
}
