import type { inferRouterOutputs } from '@trpc/server';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import { useViewAsOf } from '@/contexts/ViewAsOfProvider';
import { groupCategoryRates } from '@/lib/category-rates';
import type { AppRouter } from '@/lib/trpc';
import { trpc } from '@/router';
import type { CreateRateHandler } from './InlineRateEditor';
import { PaymentCategoriesSection } from './PaymentCategoriesSection';
import { PayslipsSection } from './PayslipsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

export function EmployeePayrollAccordion(props: {
  employeeIds: number[];
  onCreateRate: CreateRateHandler;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const [openEmployeeIds, setOpenEmployeeIds] = useState<number[]>([]);

  useEffect(() => {
    if (props.employeeIds[0]) {
      setOpenEmployeeIds([props.employeeIds[0]]);
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
  const { data: employee } = useQuery(trpc.employees.get.queryOptions({ id: props.employeeId }));
  const { viewAsOfAt } = useViewAsOf();
  const { data: categoryRates = [] } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: viewAsOfAt }),
  );
  const { data: payslips = [] } = useQuery(trpc.employees.payslips.list.queryOptions({ employeeId: props.employeeId }));
  const categoryGroups = groupCategoryRates(categoryRates, viewAsOfAt);

  if (!employee) return null;

  return (
    <AccordionItem value={props.employeeId}>
      <AccordionTrigger className="items-center">
        <span className="text-sm font-semibold">{employee.name}</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5 text-muted-foreground">
          <Badge variant="outline">{categoryGroups.length} categories</Badge>
          <Badge variant="outline">{payslips.length} pay slips</Badge>
          <Badge variant="outline">{employee.age} years</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-5">
        <EmployeeDetails employeeId={props.employeeId} />
        <PaymentCategoriesSection employeeId={props.employeeId} onCreateRate={props.onCreateRate} />
        <PayslipsSection employeeId={props.employeeId} onCreatePayslip={props.onCreatePayslip} />
      </AccordionContent>
    </AccordionItem>
  );
}

export function EmployeeDetails(props: { employeeId: number }) {
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
