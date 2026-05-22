import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function EmployeesTableSkeleton() {
  return (
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
  );
}

export function EmployeeProfileSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card ring-1 ring-primary/20">
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
          <TableRow className="border-x-0 hover:bg-transparent">
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
        </TableBody>
      </Table>
    </div>
  );
}

export function PaymentCategoriesSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-32" />
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-7 bg-muted/40 px-2">
                <Skeleton className="h-3 w-14" />
              </TableHead>
              <TableHead className="h-7 bg-muted/40 px-2">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="h-7 bg-muted/40 px-2 text-right">
                <Skeleton className="ml-auto h-3 w-8" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 2 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="px-2 py-1.5">
                  <Skeleton className="h-3.5 w-28" />
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-14" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function PayslipsSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-7 w-8 bg-muted/40 px-1" />
              <TableHead className="h-7 bg-muted/40 px-2">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead className="h-7 bg-muted/40 px-2 text-right">
                <Skeleton className="ml-auto h-3 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 2 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="w-8 px-1 py-1.5">
                  <Skeleton className="size-3.5" />
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-14" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

export function EmployeePanelSkeleton(props: { className?: string }) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4', props.className)}>
      <div>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-1.5 h-4 w-48" />
      </div>
      <EmployeeProfileSkeleton />
      <div className="flex flex-col gap-6">
        <PaymentCategoriesSkeleton />
        <PayslipsSectionSkeleton />
      </div>
    </div>
  );
}
