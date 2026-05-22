import { MonthPickerField } from '@/components/MonthPickerField';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useViewAsOf, ViewAsOfProvider } from '@/components/ViewAsOfProvider';
import type { AppRouter } from '@/lib/trpc';
import appCss from '@/styles.css?url';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { format } from 'date-fns';

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
      <body>
        <ViewAsOfProvider>
          <TooltipProvider>
            <SidebarProvider
              style={
                {
                  '--sidebar-width': 'calc(var(--spacing) * 72)',
                  '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
              }
            >
              <AppSidebar />
              <SidebarInset>
                <AppNavigation />
                <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">{props.children}</div>
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>

            <Toaster />
          </TooltipProvider>
        </ViewAsOfProvider>

        <Scripts />
      </body>
    </html>
  );
}

function AppSidebar() {
  const { viewAsOfMonth, setViewAsOfMonth } = useViewAsOf();
  return (
    <Sidebar>
      <SidebarHeader className="flex-row items-center justify-between">
        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          <MonthPickerField
            aria-label="View data as of month"
            className="h-auto bg-background/80 backdrop-blur"
            value={viewAsOfMonth}
            onChange={setViewAsOfMonth}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>123</SidebarContent>
    </Sidebar>
  );
}

function AppNavigation() {
  const { isRetroactiveView, viewAsOfMonth } = useViewAsOf();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-2 px-4 md:gap-4 md:px-6">
        <SidebarTrigger />
        {isRetroactiveView && (
          <Alert className="max-w-max border-0 bg-transparent text-amber-400">
            <AlertTriangleIcon />
            <AlertTitle className="font-bold">View effective of: {format(viewAsOfMonth, 'MMMM yyyy')}</AlertTitle>
          </Alert>
        )}
      </div>
    </header>
  );
}
