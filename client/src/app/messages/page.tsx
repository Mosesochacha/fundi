"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth";

/** The standalone /messages page has been replaced by role-based dashboards. */
export default function MessagesRedirect() {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const base =
      role === "employer" ? "/employer/messages" : "/worker/messages";
    router.replace(base);
  }, [isLoading, role, router]);

  return null;
}
