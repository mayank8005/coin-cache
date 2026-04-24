"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (typeof navigator !== "undefined" && !navigator.onLine) return false;
              return failureCount < 2 && !(error as { status?: number })?.status;
            },
          },
        },
      }),
  );
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
