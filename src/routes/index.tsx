import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { EmployeePayrollAccordion } from '@/components/EmployeePayrollAccordion';
import { trpc } from '@/router';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(trpc.employees.list.queryOptions());
  const createRate = useMutation(
    trpc.paymentCategories.rates.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.paymentCategories.forEmployee.queryFilter());
      },
    }),
  );
  const createPayslip = useMutation(
    trpc.employees.payslips.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.employees.payslips.list.queryFilter());
        void queryClient.invalidateQueries(trpc.employees.payslips.get.queryFilter());
      },
    }),
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <EmployeePayrollAccordion
          employeeIds={data.map((employee) => employee.id)}
          onCreateRate={createRate.mutate}
          onCreatePayslip={async (input) => {
            await createPayslip.mutateAsync(input);
          }}
        />
      </div>
    </div>
  );
}
