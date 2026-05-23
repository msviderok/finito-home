import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTRPC } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/employees')({
  component: EmployeesRoute,
  loader: async ({ context: { trpc, queryClient } }) => {
    try {
      await queryClient.ensureQueryData(trpc.employees.list.queryOptions());
    } catch (error) {
      console.log('[employees loader] failed to prefetch employees.list', error);
      throw error;
    }
  },
  pendingComponent() {
    return (
      <>
        <section className="flex flex-1 flex-col gap-4">
          <div>
            <h1 className="text-md font-semibold tracking-tight">Employees</h1>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="h-8 w-8 bg-muted/40 px-2" />
                  <TableHead className="h-8 bg-muted/40 px-3">
                    <Skeleton className="h-3 w-10" />
                  </TableHead>
                  <TableHead className="h-8 bg-muted/40 px-3">
                    <Skeleton className="h-3 w-20" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index} className="border-x-0 hover:bg-transparent">
                    <TableCell className="w-8 px-2">
                      <Skeleton className="size-3.5" />
                    </TableCell>
                    <TableCell className="px-3">
                      <Skeleton className="h-3.5 w-28" />
                    </TableCell>
                    <TableCell className="px-3">
                      <Skeleton className="h-3.5 w-32" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <aside className="w-min-(--employee-panel-width) w-full shrink-0 flex-col lg:flex" />
      </>
    );
  },
});

function EmployeesRoute() {
  const trpc = useTRPC();
  const navigate = Route.useNavigate();
  const selectedEmployeeId = useParams({ from: '/employees/$id', shouldThrow: false });
  const { data: employees = [] } = useQuery(trpc.employees.list.queryOptions());

  return (
    <>
      <section className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-md font-semibold tracking-tight">Employees</h1>
          <p className="text-sm/relaxed text-muted-foreground">Select an employee to manage payroll settings.</p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="h-8 w-8 bg-muted/40 px-2" />
                <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Name</TableHead>
                <TableHead className="h-8 bg-muted/40 px-3 text-xs text-muted-foreground">Birthday</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="px-3 py-8 text-center text-muted-foreground">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
              {employees.map((employee) => {
                const isSelected = selectedEmployeeId?.id === employee.id;
                return (
                  <TableRow
                    key={employee.id}
                    aria-selected={isSelected}
                    aria-current={isSelected ? 'true' : undefined}
                    data-state={isSelected ? 'selected' : undefined}
                    onClick={() => navigate({ to: '/employees/$id', params: { id: employee.id } })}
                    className={cn(
                      'cursor-pointer border-x-0 transition-colors hover:bg-muted/40',
                      isSelected &&
                        'border-l-2 border-l-primary bg-primary/10 shadow-[inset_3px_0_0_0_var(--color-primary)] hover:bg-primary/15 dark:brightness-150 [&_td]:bg-primary/20',
                    )}
                  >
                    <TableCell className="w-8 px-2">
                      {isSelected ? (
                        <ChevronRight className="size-3.5 text-primary brightness-150" aria-hidden />
                      ) : (
                        <span className="inline-block size-3.5" aria-hidden />
                      )}
                    </TableCell>
                    <TableCell className="px-3">
                      <span
                        className={cn(
                          'font-medium',
                          isSelected ? 'text-primary dark:brightness-150' : 'text-foreground',
                        )}
                      >
                        {employee.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground tabular-nums">
                      {format(employee.birthday, 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <aside className="w-(--employee-panel-width) shrink-0 flex-col lg:flex">
        <Outlet />
      </aside>
    </>
  );
}
