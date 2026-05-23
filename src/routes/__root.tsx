import { MonthPickerField } from '@/components/MonthPickerField';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EffectiveDateProvider, useEffectiveDate } from '@/lib/hooks/useEffectiveDate';
import type { AppRouter } from '@/lib/trpc';
import appCss from '@/styles.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { ClientOnly, createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { format } from 'date-fns';
import { AlertTriangleIcon } from 'lucide-react';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<AppRouter>;
}>()({
  head: () => ({
    links: [{ rel: 'stylesheet', href: appCss }],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Finito Home Assignment' },
    ],
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
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="@max/main:mx-auto container mx-auto flex max-w-7xl flex-col">
        <TooltipProvider>
          <EffectiveDateProvider>
            <AppNavigation />
            <main className="flex flex-1 flex-col">
              <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                  <div className="grid min-h-0 max-w-full grid-cols-[1fr] gap-6 lg:grid-cols-[1fr_auto]">
                    {props.children}
                  </div>
                </div>
              </div>
            </main>
            <Toaster />
          </EffectiveDateProvider>
        </TooltipProvider>

        <Scripts />
      </body>
    </html>
  );
}

function AppNavigation() {
  const { isRetroactiveView, effectiveDate, setEffectiveDate } = useEffectiveDate();
  return (
    <ClientOnly>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b">
        <div className="flex w-full items-center justify-between gap-2 px-4 md:gap-4 md:px-6">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <MonthPickerField
              aria-label="View data as of month"
              className="h-auto bg-background/80 backdrop-blur"
              value={effectiveDate}
              onChange={setEffectiveDate}
            />
          </div>
          {isRetroactiveView && (
            <Alert className="max-w-max border-0 bg-transparent text-amber-400">
              <AlertTriangleIcon />
              <AlertTitle className="font-bold">View effective of: {format(effectiveDate, 'MMMM yyyy')}</AlertTitle>
            </Alert>
          )}
        </div>
      </header>
    </ClientOnly>
  );
}
