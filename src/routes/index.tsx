import { EmployeePanelSkeleton, EmployeesTableSkeleton } from '@/components/loading-skeletons';
import { PaymentCategoriesSection } from '@/components/PaymentCategoriesSection';
import { PayslipsSection } from '@/components/PayslipsSection';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PayslipCreateMutationInput } from '@/db/schema/payslips';
import { useTRPC, type RouterOutputs } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import * as v from 'valibot';

const EMPLOYEE_PANEL_WIDTH = '28rem';

const indexSearchSchema = v.object({
  employee: v.optional(v.number()),
});

export const Route = createFileRoute('/')({
  validateSearch: indexSearchSchema,
  component: EmployeesRoute,
});

export type Employee = RouterOutputs['employees']['get'];
export type CreatePayslipHandler = (input: PayslipCreateMutationInput) => Promise<void> | void;

function EmployeesRoute() {
  const navigate = useNavigate({ from: '/' });
  const { employee: selectedEmployeeId } = Route.useSearch();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: employees = [], isPending: employeesLoading } = useQuery(trpc.employees.list.queryOptions());
  const selectedEmployee =
    selectedEmployeeId != null ? (employees.find((employee) => employee.id === selectedEmployeeId) ?? null) : null;
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

  useEffect(() => {
    if (
      selectedEmployeeId != null &&
      !employeesLoading &&
      !employees.some((employee) => employee.id === selectedEmployeeId)
    ) {
      void navigate({ search: (prev) => ({ ...prev, employee: undefined }), replace: true });
    }
  }, [employees, employeesLoading, navigate, selectedEmployeeId]);

  const selectEmployee = (employeeId: number) => {
    void navigate({ search: (prev) => ({ ...prev, employee: employeeId }) });
  };

  const closePanel = () => {
    void navigate({ search: (prev) => ({ ...prev, employee: undefined }) });
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row lg:items-stretch"
      style={{ '--employee-panel-width': EMPLOYEE_PANEL_WIDTH } as React.CSSProperties}
    >
      <section
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-4 transition-[padding]',
          selectedEmployeeId != null && 'lg:pr-0',
        )}
      >
        <div>
          <h1 className="text-md font-semibold tracking-tight">Employees</h1>
          <p className="text-sm/relaxed text-muted-foreground">Select an employee to manage payroll settings.</p>
        </div>

        {employeesLoading ? (
          <EmployeesTableSkeleton />
        ) : (
          <EmployeesTable
            employees={employees}
            selectedEmployeeId={selectedEmployeeId ?? null}
            onSelect={selectEmployee}
          />
        )}

        {selectedEmployeeId != null && employeesLoading && <EmployeePanelSkeleton className="lg:hidden" />}
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

      {selectedEmployeeId != null && employeesLoading && (
        <aside className="hidden w-(--employee-panel-width) shrink-0 flex-col lg:flex">
          <EmployeePanelSkeleton />
        </aside>
      )}
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
    <aside className="hidden w-(--employee-panel-width) shrink-0 flex-col lg:flex">
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
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4', props.className)}>
      <div className="flex items-start gap-2">
        <Button type="button" variant="outline" size="icon-sm" className="shrink-0" onClick={props.onClose}>
          <ChevronLeft className="size-4" />
        </Button>
        <h1 className="text-md font-semibold tracking-tight">Payroll details</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto lg:max-h-[calc(100svh-var(--header-height)-12rem)]">
        <PaymentCategoriesSection employeeId={props.employee.id} onCreateRate={props.onCreateRate} />
        <PayslipsSection employeeId={props.employee.id} onCreatePayslip={props.onCreatePayslip} />
      </div>
    </div>
  );
}
