import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/trpc/routers/_app';
import { createContext } from '@/trpc/context';

const handler = async (req: Request) => {
  const responseCookies = new Map<string, string>();

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req: { headers: Object.fromEntries(req.headers.entries()) }, responseCookies }),
  });

  if (responseCookies.size > 0) {
    const newHeaders = new Headers(response.headers);
    for (const cookie of responseCookies.values()) {
      newHeaders.append('Set-Cookie', cookie);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
};

export { handler as GET, handler as POST };
