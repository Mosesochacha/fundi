"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useAuth } from "@/features/auth";

/** Forward old deep links to the role-based messages page with the conversation pre-selected. */
export default function ConversationRedirect({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    const base =
      role === "employer" ? "/employer/messages" : "/worker/messages";
    router.replace(`${base}?c=${conversationId}`);
  }, [isLoading, role, conversationId, router]);

  return null;
}
