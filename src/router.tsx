import { notifyTRPCError, trpcClient, TRPCProvider, type AppRouter } from '@/lib/trpc/client';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import superjson from 'superjson';
import { routeTree } from './routeTree.gen';

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
  client: trpcClient,
  queryClient,
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

    Wrap(props) {
      return <TRPCProvider trpcClient={trpcClient} queryClient={queryClient} {...props} />;
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

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
