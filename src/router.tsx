import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { TRPCClientError, createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { toast } from 'sonner';
import superjson from 'superjson';
import type { AppRouter } from '@/lib/trpc';
import { routeTree } from './routeTree.gen';
import { env } from '@/env';

function getTrpcUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/trpc`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/trpc`;
  }
  return `http://127.0.0.1:${env.PORT}/api/trpc`;
}

function isTRPCClientError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}

function notifyTRPCError(error: unknown) {
  if (typeof window === 'undefined' || !isTRPCClientError(error)) return;

  toast.error('Request failed', {
    description: error.message,
  });
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: notifyTRPCError,
  }),
  mutationCache: new MutationCache({
    onError: notifyTRPCError,
  }),
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
  },
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient,
  client: createTRPCClient({
    links: [
      httpBatchLink({
        transformer: superjson,
        url: getTrpcUrl(),
      }),
    ],
  }),
});

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    context: {
      queryClient,
      trpc,
    },

    Wrap: function WrapComponent(props) {
      return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
    },
    defaultErrorComponent(props) {
      return <div>Error: {props.error.message}</div>;
    },
    defaultNotFoundComponent() {
      return <div>Not Found</div>;
    },
    defaultPendingComponent() {
      return <div>Pending...</div>;
    },
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
