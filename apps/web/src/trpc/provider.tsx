'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';
import { getQueryClient } from './query-client';
import { authStorage } from '@/lib/auth-storage';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.APP_URL) return process.env.APP_URL;
  return 'http://localhost:3000';
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            const token = authStorage.getAccessToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
