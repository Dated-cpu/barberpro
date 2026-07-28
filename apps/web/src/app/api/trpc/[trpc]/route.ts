import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/trpc/routers/_app';
import { createContext } from '@/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req: { headers: Object.fromEntries(req.headers.entries()) } }),
  });

export { handler as GET, handler as POST };
