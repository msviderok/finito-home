import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import superjson from 'superjson';
import type { AppRouter } from '@/lib/trpc';
import { routeTree } from './routeTree.gen';
import { env } from '@/env';

const queryClient = new QueryClient({
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
        url: `http://localhost:${env.PORT}/api/trpc`,
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
