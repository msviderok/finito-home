import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { EmployeePayrollAccordion } from '@/components/EmployeePayrollAccordion';
import { trpc } from '@/router';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(trpc.listEmployees.queryOptions());
  const createRate = useMutation(
    trpc.createRate.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.listEmployees.queryFilter());
      },
    }),
  );
  const createPayslip = useMutation(
    trpc.createPayslip.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.listEmployees.queryFilter());
      },
    }),
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <EmployeePayrollAccordion
          employees={data}
          onCreateRate={createRate.mutate}
          onCreatePayslip={async (input) => {
            await createPayslip.mutateAsync(input);
          }}
        />
      </div>
    </div>
  );
}
