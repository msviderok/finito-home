import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import { useTRPC, type RouterOutputs } from '@/lib/trpc/client';
import type { CreateRateHandler } from './InlineRateEditor';
import { PaymentCategoriesSection } from './PaymentCategoriesSection';
import { PayslipsSection } from './PayslipsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { format } from 'date-fns';

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

export function EmployeePayrollAccordion(props: {
  employeeIds: number[];
  onCreateRate: CreateRateHandler;
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
  onCreateRate: CreateRateHandler;
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
