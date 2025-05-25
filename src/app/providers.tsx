// app/providers.tsx
"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AxiosError } from "axios";
import { useSyncAuthCookie } from "@/hooks/useSyncAuthCookie";
import { ClientOnlyToastContainer } from "@/components/ClientOnlyToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (
                error instanceof AxiosError &&
                error.response?.status === 429
              ) {
                return failureCount < 3;
              }
              return false;
            },
          },
        },
      })
  );

  useSyncAuthCookie();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      <ClientOnlyToastContainer />
    </QueryClientProvider>
  );
}
