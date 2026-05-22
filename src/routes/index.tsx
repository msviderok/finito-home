import { EmployeesTableSkeleton } from '@/components/loading-skeletons';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { PayslipsSection } from '@/components/PayslipsSection';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import { useTRPC, type RouterOutputs } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronRight, XIcon } from 'lucide-react';
import { useState } from 'react';

const EMPLOYEE_PANEL_WIDTH = '28rem';

export const Route = createFileRoute('/')({
  component: EmployeesRoute,
});

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

function EmployeesRoute() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: employees = [], isPending: employeesLoading } = useQuery(trpc.employees.list.queryOptions());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId) ?? null;
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

  const closePanel = () => setSelectedEmployeeId(null);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch"
      style={{ '--employee-panel-width': EMPLOYEE_PANEL_WIDTH } as React.CSSProperties}
    >
      <section className={cn('flex min-w-0 flex-1 flex-col gap-4 transition-[padding]', selectedEmployee && 'lg:pr-0')}>
        <div>
          <h1 className="text-md font-semibold tracking-tight">Employees</h1>
          <p className="text-sm/relaxed text-muted-foreground">Select an employee to manage payroll settings.</p>
        </div>

        {employeesLoading ? (
          <EmployeesTableSkeleton />
        ) : (
          <EmployeesTable
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={setSelectedEmployeeId}
          />
        )}

        {selectedEmployee && (
          <EmployeeSettingsPanelContent
            className="lg:hidden"
            employee={selectedEmployee}
            onClose={closePanel}
            onCreateRate={createRate.mutate}
            onCreatePayslip={async (input) => {
              await createPayslip.mutateAsync(input);
            }}
          />
        )}
      </section>

      {selectedEmployee && (
        <EmployeeSettingsPanel
          employee={selectedEmployee}
          onClose={closePanel}
          onCreateRate={createRate.mutate}
          onCreatePayslip={async (input) => {
            await createPayslip.mutateAsync(input);
          }}
        />
      )}
    </div>
  );
}

function EmployeesTable(props: {
  employees: Employee[];
  selectedEmployeeId: number | null;
  onSelect: (employeeId: number) => void;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-card transition-shadow',
        props.selectedEmployeeId !== null && 'ring-1 ring-primary/20',
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="h-8 w-8 bg-muted/40 px-2" />
            <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Name</TableHead>
            <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Birthday</TableHead>
            <TableHead className="h-8 bg-muted/40 px-3 text-right text-xs text-muted-foreground">Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.employees.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                No employees found.
              </TableCell>
            </TableRow>
          )}
          {props.employees.map((employee) => {
            const isSelected = props.selectedEmployeeId === employee.id;
            return (
              <TableRow
                key={employee.id}
                aria-selected={isSelected}
                aria-current={isSelected ? 'true' : undefined}
                data-state={isSelected ? 'selected' : undefined}
                className={cn(
                  'cursor-pointer border-x-0 transition-colors hover:bg-muted/40',
                  isSelected &&
                    'border-l-2 border-l-primary bg-primary/10 shadow-[inset_3px_0_0_0_var(--color-primary)] hover:bg-primary/15',
                )}
                onClick={() => props.onSelect(employee.id)}
              >
                <TableCell className="w-8 px-2">
                  {isSelected ? (
                    <ChevronRight className="size-3.5 text-primary" aria-hidden />
                  ) : (
                    <span className="inline-block size-3.5" aria-hidden />
                  )}
                </TableCell>
                <TableCell className="px-3">
                  <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                    {employee.name}
                  </span>
                </TableCell>
                <TableCell className="px-3 text-muted-foreground tabular-nums">
                  {format(employee.birthday, 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="px-3 text-right text-muted-foreground tabular-nums">
                  {employee.age} years
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EmployeeSettingsPanel(props: {
  employee: Employee;
  onClose: () => void;
  onCreateRate: any;
  onCreatePayslip: CreatePayslipHandler;
}) {
  return (
    <aside className="hidden w-(--employee-panel-width) shrink-0 flex-col overflow-hidden border-l border-primary/20 bg-primary/[0.02] lg:flex">
      <EmployeeSettingsPanelContent
        employee={props.employee}
        onClose={props.onClose}
        onCreateRate={props.onCreateRate}
        onCreatePayslip={props.onCreatePayslip}
      />
    </aside>
  );
}

function EmployeeSettingsPanelContent(props: {
  className?: string;
  employee: Employee;
  onClose: () => void;
  onCreateRate: any;
  onCreatePayslip: CreatePayslipHandler;
}) {
  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden bg-background', props.className)}>
      <div className="flex shrink-0 items-start gap-2 border-b border-primary/15 bg-primary/5 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.625rem] font-medium tracking-wide text-primary uppercase">Payroll details</p>
          <h2 className="truncate text-xs font-semibold">{props.employee.name}</h2>
          <p className="text-xs/relaxed text-muted-foreground">
            {format(props.employee.birthday, 'MMM d, yyyy')} · {props.employee.age} years
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={props.onClose}>
          <XIcon />
          <span className="sr-only">Close employee settings</span>
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:max-h-[calc(100svh-var(--header-height)-3rem)]">
        <EmployeeDetails employee={props.employee} />
        <PaymentCategoriesSection employeeId={props.employee.id} onCreateRate={props.onCreateRate} />
        <Separator />
        <PayslipsSection employeeId={props.employee.id} onCreatePayslip={props.onCreatePayslip} />
      </div>
    </div>
  );
}

function EmployeeDetails(props: { employee: Employee }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium text-muted-foreground">Profile</h3>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
        <Detail label="Full name" value={props.employee.name} />
        <Detail label="Birthday" value={format(props.employee.birthday, 'MMM d, yyyy')} />
        <Detail label="Age" value={`${props.employee.age} years`} />
      </dl>
    </section>
  );
}

function Detail(props: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{props.label}</dt>
      <dd className="text-xs font-medium tabular-nums">{props.value}</dd>
    </div>
  );
}
