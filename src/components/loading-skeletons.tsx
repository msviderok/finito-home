import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function EmployeesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableHead className="h-8 bg-muted/40 px-3">
              <Skeleton className="h-3 w-10" />
            </TableHead>
            <TableHead className="h-8 bg-muted/40 px-3">
              <Skeleton className="h-3 w-14" />
            </TableHead>
            <TableHead className="h-8 bg-muted/40 px-3 text-right">
              <Skeleton className="ml-auto h-3 w-8" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }, (_, index) => (
            <TableRow key={index} className="border-x-0 hover:bg-transparent">
              <TableCell className="px-3">
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell className="px-3">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell className="px-3 text-right">
                <Skeleton className="ml-auto h-3.5 w-14" />
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
    <section>
      <Skeleton className="mb-3 h-3 w-12" />
      <dl className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-md border bg-muted/20 px-3 py-2.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="mt-2 h-3.5 w-24" />
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PaymentCategoriesSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <Skeleton className="h-3.5 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="ml-auto h-3.5 w-20" />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
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
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <PayslipPanelSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export function PayslipPanelSkeleton() {
  return (
    <article className="flex flex-col gap-3 rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="ml-auto h-3.5 w-16" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="grid gap-2 rounded-md border px-2 py-1.5 sm:grid-cols-[1fr_auto_auto_auto]">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-3.5 w-14 justify-self-end" />
          </div>
        ))}
        <Skeleton className="h-px w-full" />
        <div className="flex justify-end gap-3">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </article>
  );
}

export function EmployeePanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto p-4 lg:max-h-[calc(100svh-var(--header-height)-3rem)]">
      <EmployeeProfileSkeleton />
      <PaymentCategoriesSkeleton />
      <Skeleton className="h-px w-full" />
      <PayslipsSectionSkeleton />
    </div>
  );
}
