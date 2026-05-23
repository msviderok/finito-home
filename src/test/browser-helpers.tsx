import { MonthPickerField } from '@/components/MonthPickerField';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { PayslipsSection } from '@/components/PayslipsSection';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { CategoryRate } from '@/lib/category-rates';
import { formatMonthInputValue } from '@/lib/date';
import { EffectiveDateProvider, useEffectiveDate } from '@/lib/hooks/useEffectiveDate';
import type { AppRouter } from '@/lib/trpc';
import { useTRPC } from '@/lib/trpc/client';
import { trpc } from '@/router';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter as createTanStackRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { format, startOfMonth } from 'date-fns';
import { render } from 'vitest-browser-react';
import { seedEmployeeRates } from './stores';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function ConnectedPayslipsSection(props: { employeeId: number }) {
  const trpcClient = useTRPC();
  const queryClient = useQueryClient();
  const createPayslip = useMutation(
    trpcClient.employees.payslips.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpcClient.employees.payslips.list.queryFilter());
      },
    }),
  );
  return <PayslipsSection employeeId={props.employeeId} onCreatePayslip={createPayslip.mutateAsync} />;
}

function EmployeeWorkbench(props: { employeeId: number }) {
  return (
    <div className="flex flex-col gap-6">
      <PaymentCategoriesSection employeeId={props.employeeId} onCreateRate={() => {}} />
      <ConnectedPayslipsSection employeeId={props.employeeId} />
    </div>
  );
}

function EffectiveDateToolbar() {
  const { effectiveDate, setEffectiveDate } = useEffectiveDate();
  return <MonthPickerField aria-label="View data as of month" value={effectiveDate} onChange={setEffectiveDate} />;
}

export async function renderEmployeeWorkbench(options: {
  employeeId: number;
  rates: CategoryRate[];
  initialViewAsOfMonth?: Date;
  withEffectiveDatePicker?: boolean;
}) {
  const queryClient = createTestQueryClient();
  seedEmployeeRates(options.employeeId, options.rates);
  const queryOptions = trpc.employees.payslips.list.queryOptions({ employeeId: options.employeeId });
  queryClient.setQueryData(queryOptions.queryKey, []);

  const ui = (
    <>
      {options.withEffectiveDatePicker !== false && <EffectiveDateToolbar />}
      <EmployeeWorkbench employeeId={options.employeeId} />
    </>
  );

  const rootRoute = createRootRouteWithContext<{
    queryClient: QueryClient;
    trpc: TRPCOptionsProxy<AppRouter>;
  }>()();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => ui,
  });
  const router = createTanStackRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({
      initialEntries: [
        `/?effectiveDate=${formatMonthInputValue(options.initialViewAsOfMonth ?? startOfMonth(new Date()))}`,
      ],
    }),
    context: {
      queryClient,
      trpc,
    },
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <EffectiveDateProvider
            initialInput={
              options.initialViewAsOfMonth != null ? format(options.initialViewAsOfMonth, 'MM-yyyy') : undefined
            }
          >
            {children}
          </EffectiveDateProvider>
        </TooltipProvider>
      </QueryClientProvider>
    ),
  });
  await router.load({ sync: true });

  return { queryClient, router, ui };
}

export async function renderBrowserWorkbench(options: Parameters<typeof renderEmployeeWorkbench>[0]) {
  const { router, queryClient } = await renderEmployeeWorkbench(options);
  const screen = await render(<RouterProvider router={router} />);
  return { screen, queryClient };
}
