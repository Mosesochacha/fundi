"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

function PostHogIdentifier() {
  const { isLoggedIn, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      posthog.identify(user.id);
    } else {
      posthog.reset();
    }
  }, [isLoggedIn, user?.id]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage",
    });
  }, []);

  if (!POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  );
}
