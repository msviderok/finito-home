import type { inferRouterOutputs } from '@trpc/server';
import { useEffect, useMemo, useState } from 'react';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import type { AppRouter } from '@/lib/trpc';
import { InlineRateEditor } from './RateEditPopover';
import { PaymentCategoriesSection } from './PaymentCategoriesSection';
import { PayslipsSection } from './PayslipsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';

export type Employee = inferRouterOutputs<AppRouter>['listEmployees'][number];
export type CategoryRate = Employee['categoryRates'][number];
export type CategoryRateGroup = {
  paymentCategoryId: number;
  paymentCategory: CategoryRate['paymentCategory'];
  currentRate: CategoryRate;
  rates: CategoryRate[];
};
export type CreateRateHandler = Parameters<typeof InlineRateEditor>[0]['onCreateRate'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

export function EmployeePayrollAccordion(props: {
  employees: Employee[];
  onCreateRate: CreateRateHandler;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const [openEmployeeIds, setOpenEmployeeIds] = useState<number[]>([]);

  useEffect(() => {
    if (props.employees[0]) {
      setOpenEmployeeIds([props.employees[0].id]);
    }
  }, [props.employees]);

  return (
    <Accordion multiple value={openEmployeeIds} onValueChange={setOpenEmployeeIds}>
      {props.employees.map((employee) => (
        <EmployeeAccordionItem
          key={employee.id}
          employee={employee}
          onCreateRate={props.onCreateRate}
          onCreatePayslip={props.onCreatePayslip}
        />
      ))}
    </Accordion>
  );
}

export function EmployeeAccordionItem(props: {
  employee: Employee;
  onCreateRate: CreateRateHandler;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const categoryGroups = useMemo(
    () => groupCategoryRates(props.employee.categoryRates),
    [props.employee.categoryRates],
  );

  return (
    <AccordionItem value={props.employee.id}>
      <AccordionTrigger className="items-center">
        <span className="text-sm font-semibold">{props.employee.name}</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5 text-muted-foreground">
          <Badge variant="outline">{categoryGroups.length} categories</Badge>
          <Badge variant="outline">{props.employee.payslips.length} pay slips</Badge>
          <Badge variant="outline">{props.employee.age} years</Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent className="flex flex-col gap-5">
        <EmployeeDetails employee={props.employee} />
        <PaymentCategoriesSection
          employeeId={props.employee.id}
          categoryGroups={categoryGroups}
          onCreateRate={props.onCreateRate}
        />
        <PayslipsSection
          employee={props.employee}
          categoryGroups={categoryGroups}
          onCreatePayslip={props.onCreatePayslip}
        />
      </AccordionContent>
    </AccordionItem>
  );
}

export function EmployeeDetails(props: { employee: Employee }) {
  return (
    <section className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
      <Detail label="Full name" value={props.employee.name} />
      <Detail label="Birthday" value={props.employee.birthday.toLocaleDateString()} />
      <Detail label="Age" value={`${props.employee.age} years`} />
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

function groupCategoryRates(rates: CategoryRate[]): CategoryRateGroup[] {
  const groups = new Map<number, CategoryRate[]>();
  for (const rate of rates) {
    const existingRates = groups.get(rate.paymentCategoryId) ?? [];
    existingRates.push(rate);
    groups.set(rate.paymentCategoryId, existingRates);
  }

  return [...groups.entries()].map(([paymentCategoryId, groupRates]) => {
    const sortedRates = [...groupRates].sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
    const currentRate = sortedRates.find((rate) => rate.effectiveTo === null) ?? sortedRates[0];
    return {
      paymentCategoryId,
      paymentCategory: currentRate.paymentCategory,
      currentRate,
      rates: sortedRates,
    };
  });
}
