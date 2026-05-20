import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import superjson from 'superjson';
import type { AppRouter } from '@/lib/trpc.init';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
  },
});

function getTRPCUrl() {
  if (typeof window !== 'undefined') return '';
  return `http://localhost:${process.env.PORT ?? 3000}/api/trpc`;
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient,
  client: createTRPCClient({
    links: [
      httpBatchStreamLink({
        transformer: superjson,
        url: getTRPCUrl(),
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
