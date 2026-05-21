import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import type { AppRouter } from '@/lib/trpc';
import appCss from '@/styles.css?url';
import Layout from '@/components/Layout';

interface MyRouterContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Finito Home Assignment' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
});

function RootDocument(props: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <Layout>{props.children}</Layout>
        <Scripts />
      </body>
    </html>
  );
}
