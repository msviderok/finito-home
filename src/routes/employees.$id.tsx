import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { PayslipsSection } from '@/components/PayslipsSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTRPC } from '@/lib/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import * as v from 'valibot';

export const Route = createFileRoute('/employees/$id')({
  component: RouteComponent,
  params: {
    parse: (raw) => v.parse(v.object({ id: v.pipe(v.string(), v.toNumber(), v.integer()) }), raw),
  },
  loader: async ({ context: { trpc, queryClient }, params }) => {
    await queryClient.ensureQueryData(trpc.employees.get.queryOptions({ id: params.id }));
  },
  pendingComponent() {
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="mt-1.5 h-4 w-48" />
    </div>;
  },
});

function RouteComponent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const { id: employeeId } = Route.useParams();
  const employee = useQuery(trpc.employees.get.queryOptions({ id: employeeId }));

  const createRate = useMutation(
    trpc.rates.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.paymentCategories.forEmployee.queryFilter());
      },
    }),
  );
  const createPayslip = useMutation(
    trpc.employees.payslips.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.employees.payslips.pathFilter());
      },
    }),
  );

  if (!employee.data) {
    return <div>No employee found</div>;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          onClick={() => navigate({ to: '/employees' })}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-md font-semibold tracking-tight">Payroll details</h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:max-h-[calc(100svh-var(--header-height)-12rem)]">
        <PaymentCategoriesSection employeeId={employee.data.id} onCreateRate={createRate.mutate} />
        <PayslipsSection employeeId={employee.data.id} onCreatePayslip={createPayslip.mutate} />
      </div>
    </div>
  );
}
