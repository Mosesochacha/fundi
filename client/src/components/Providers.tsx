"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { registerRouter } from "@/lib/navigation";
import { queryClient } from "@/lib/queryClient";

/** Exposes the App Router to non-component code (see lib/navigation.ts). */
function RouterRegistrar() {
  const router = useRouter();
  useEffect(() => {
    registerRouter(router);
  }, [router]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <RouterRegistrar />
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
