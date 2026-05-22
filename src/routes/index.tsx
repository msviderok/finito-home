import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { PayslipsSection } from '@/components/PayslipsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import { useTRPC, type RouterOutputs } from '@/lib/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data = [] } = useQuery(trpc.employees.list.queryOptions());
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
        void queryClient.invalidateQueries(trpc.employees.payslips.list.queryFilter());
        void queryClient.invalidateQueries(trpc.employees.payslips.get.queryFilter());
      },
    }),
  );

  return (
    <EmployeePayrollAccordion
      employeeIds={data.map((employee) => employee.id)}
      onCreateRate={createRate.mutate}
      onCreatePayslip={async (input) => {
        await createPayslip.mutateAsync(input);
      }}
    />
  );
}

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

export function EmployeePayrollAccordion(props: {
  employeeIds: number[];
  onCreateRate: any;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const [openEmployeeIds, setOpenEmployeeIds] = useState<number[]>([]);
  const init = useRef(false);

  useEffect(() => {
    if (init.current) return;
    if (props.employeeIds[0]) {
      setOpenEmployeeIds([props.employeeIds[0]]);
      init.current = true;
    }
  }, [props.employeeIds]);

  return (
    <Accordion multiple value={openEmployeeIds} onValueChange={setOpenEmployeeIds}>
      {props.employeeIds.map((employeeId) => (
        <EmployeeAccordionItem
          key={employeeId}
          employeeId={employeeId}
          onCreateRate={props.onCreateRate}
          onCreatePayslip={props.onCreatePayslip}
        />
      ))}
    </Accordion>
  );
}

export function EmployeeAccordionItem(props: {
  employeeId: number;
  onCreateRate: any;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const trpc = useTRPC();
  const { data: employee } = useQuery(trpc.employees.get.queryOptions({ id: props.employeeId }));

  if (!employee) return null;

  return (
    <AccordionItem value={props.employeeId}>
      <AccordionTrigger className="flex items-center gap-3">
        <span className="text-sm font-semibold">{employee.name}</span>
        <Separator orientation="vertical" className="h-full" />
        <p className="flex flex-wrap items-center justify-end gap-1.5 text-muted-foreground italic">
          <span>{format(employee.birthday, 'MMM yyyy')}</span>
          <span>({employee.age} years)</span>
        </p>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-10 px-0.5 py-4">
        <PaymentCategoriesSection employeeId={props.employeeId} onCreateRate={props.onCreateRate} />
        <Separator />
        <PayslipsSection employeeId={props.employeeId} onCreatePayslip={props.onCreatePayslip} />
      </AccordionContent>
    </AccordionItem>
  );
}

export function EmployeeDetails(props: { employeeId: number }) {
  const trpc = useTRPC();
  const { data: employee } = useQuery(trpc.employees.get.queryOptions({ id: props.employeeId }));

  if (!employee) return null;

  return (
    <section className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
      <Detail label="Full name" value={employee.name} />
      <Detail label="Birthday" value={employee.birthday.toLocaleDateString()} />
      <Detail label="Age" value={`${employee.age} years`} />
    </section>
  );
}

function Detail(props: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="font-medium tabular-nums">{props.value}</span>
    </div>
  );
}
