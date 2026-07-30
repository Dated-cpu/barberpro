'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './client';
import { getQueryClient } from './query-client';

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.APP_URL) return process.env.APP_URL;
  return 'http://localhost:3000';
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/trpc/auth.refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            if (typeof window !== 'undefined') {
              const match = document.cookie.match(/(?:^|;\s*)bp_csrf_token=([^;]*)/);
              if (match) {
                return { 'x-csrf-token': match[1] };
              }
            }
            return {};
          },
          fetch: async (url, opts) => {
            const reqOpts = opts ?? {};
            const res = await fetch(url, { ...reqOpts, credentials: 'include' });
            if (res.status === 401) {
              const refreshed = await tryRefreshToken();
              if (refreshed) {
                const retryHeaders = new Headers(reqOpts.headers);
                const csrfMatch = document.cookie.match(/(?:^|;\s*)bp_csrf_token=([^;]*)/);
                if (csrfMatch && csrfMatch[1]) {
                  retryHeaders.set('x-csrf-token', csrfMatch[1]);
                }
                return fetch(url, { ...reqOpts, headers: retryHeaders, credentials: 'include' });
              }
            }
            return res;
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
