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

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${getBaseUrl()}/api/trpc/auth.refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const tokens = json.result?.data;
    if (!tokens?.accessToken) return false;
    authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return true;
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
            const token = authStorage.getAccessToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
          fetch: async (url, opts) => {
            const reqOpts = opts ?? {};
            const res = await fetch(url, reqOpts);
            if (res.status === 401) {
              const refreshed = await tryRefreshToken();
              if (refreshed) {
                const newHeaders = new Headers(reqOpts.headers);
                newHeaders.set('authorization', `Bearer ${authStorage.getAccessToken()}`);
                return fetch(url, { ...reqOpts, headers: newHeaders });
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
