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
import { PanelRightCloseIcon, PanelRightOpenIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

const EMPLOYEE_PANEL_WIDTH = '28rem';

export const Route = createFileRoute('/employees')({
  component: EmployeesRoute,
});

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

function EmployeesRoute() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: employees = [], isPending: employeesLoading } = useQuery(trpc.employees.list.queryOptions());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
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

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedEmployeeId(null);
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch"
      style={{ '--employee-panel-width': EMPLOYEE_PANEL_WIDTH } as React.CSSProperties}
    >
      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xs font-semibold tracking-tight">Employees</h1>
            <p className="text-xs/relaxed text-muted-foreground">Select an employee to manage payroll settings.</p>
          </div>
          {selectedEmployee && !panelOpen && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setPanelOpen(true)}>
              <PanelRightOpenIcon />
              <span className="max-w-40 truncate">{selectedEmployee.name}</span>
            </Button>
          )}
        </div>

        {employeesLoading ? (
          <EmployeesTableSkeleton />
        ) : (
          <EmployeesTable
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={(employeeId) => {
              setSelectedEmployeeId(employeeId);
              setPanelOpen(true);
            }}
          />
        )}

        {panelOpen && selectedEmployee && (
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

      <EmployeeSettingsPanel
        employee={selectedEmployee}
        open={panelOpen && selectedEmployee !== null}
        onOpenChange={setPanelOpen}
        onClose={closePanel}
        onCreateRate={createRate.mutate}
        onCreatePayslip={async (input) => {
          await createPayslip.mutateAsync(input);
        }}
      />
    </div>
  );
}

function EmployeesTable(props: {
  employees: Employee[];
  selectedEmployeeId: number | null;
  onSelect: (employeeId: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Name</TableHead>
            <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Birthday</TableHead>
            <TableHead className="h-8 bg-muted/40 px-3 text-right text-xs text-muted-foreground">Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.employees.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                No employees found.
              </TableCell>
            </TableRow>
          )}
          {props.employees.map((employee) => (
            <TableRow
              key={employee.id}
              aria-selected={props.selectedEmployeeId === employee.id}
              data-state={props.selectedEmployeeId === employee.id ? 'selected' : undefined}
              className="cursor-pointer border-x-0 hover:bg-muted/40 data-[state=selected]:bg-primary/5 data-[state=selected]:hover:bg-primary/10"
              onClick={() => props.onSelect(employee.id)}
            >
              <TableCell className="px-3 font-medium text-foreground">{employee.name}</TableCell>
              <TableCell className="px-3 text-muted-foreground tabular-nums">
                {format(employee.birthday, 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="px-3 text-right text-muted-foreground tabular-nums">{employee.age} years</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmployeeSettingsPanel(props: {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onCreateRate: any;
  onCreatePayslip: CreatePayslipHandler;
}) {
  const showPanel = props.open && props.employee;

  return (
    <div className="relative hidden shrink-0 lg:block">
      <button
        type="button"
        aria-label={showPanel ? 'Collapse employee panel' : 'Expand employee panel'}
        title={showPanel ? 'Collapse employee panel' : 'Expand employee panel'}
        disabled={!props.employee}
        onClick={() => props.onOpenChange(!props.open)}
        className={cn(
          'absolute top-6 -left-3 z-10 flex size-6 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-0',
        )}
      >
        {showPanel ? <PanelRightCloseIcon className="size-3.5" /> : <PanelRightOpenIcon className="size-3.5" />}
      </button>

      <div
        data-state={showPanel ? 'open' : 'closed'}
        className={cn(
          'overflow-hidden transition-[width] duration-200 ease-linear',
          showPanel ? 'w-(--employee-panel-width)' : 'w-0',
        )}
      >
        <aside
          aria-hidden={!showPanel}
          className={cn(
            'flex h-full min-h-0 w-(--employee-panel-width) flex-col overflow-hidden border-l bg-background',
            !showPanel && 'pointer-events-none opacity-0',
          )}
        >
          {props.employee && showPanel && (
            <EmployeeSettingsPanelContent
              employee={props.employee}
              onClose={props.onClose}
              onCreateRate={props.onCreateRate}
              onCreatePayslip={props.onCreatePayslip}
            />
          )}
        </aside>
      </div>
    </div>
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
    <div className={cn('flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background', props.className)}>
      <div className="flex shrink-0 items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
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
      <dl className="grid gap-3 sm:grid-cols-3">
        <Detail label="Full name" value={props.employee.name} />
        <Detail label="Birthday" value={format(props.employee.birthday, 'MMM d, yyyy')} />
        <Detail label="Age" value={`${props.employee.age} years`} />
      </dl>
    </section>
  );
}

function Detail(props: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{props.label}</dt>
      <dd className="mt-1 text-xs font-medium tabular-nums">{props.value}</dd>
    </div>
  );
}
