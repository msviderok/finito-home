import { Button } from '@/components/ui/button';
import {
  SmallTable,
  smallTableCellClass,
  smallTableHeadClass,
  smallTableRowClass,
} from '@/components/ui/compact-table';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getRateAfterDismiss, groupCategoryRates } from '@/lib/category-rates';
import { currencyFormatter, isValidRateAmountInput, sanitizeRateAmountInput } from '@/lib/currency';
import { useEffectiveDate } from '@/lib/hooks/useEffectiveDate';
import { useTRPC, type RouterOutputs } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { Field, Form, reset, useForm } from '@formisch/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangleIcon, ArrowRight, Check, Edit2, HistoryIcon, Loader2Icon, Trash, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as v from 'valibot';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger, createHandle as createPopoverHandle } from './ui/popover';
import { Skeleton } from './ui/skeleton';

const historyPopover = createPopoverHandle();

export function PaymentCategoriesSection(props: { employeeId: number; onCreateRate: any }) {
  const trpc = useTRPC();
  const { effectiveDate } = useEffectiveDate();
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [editRateId, setEditRateId] = useState<number | null>(null);
  const { data: categoryRates = [], isPending } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId }),
  );

  const categoryGroups = groupCategoryRates(categoryRates, effectiveDate);
  const historyRates = categoryGroups.find((group) => group.paymentCategoryId === historyId)?.rates ?? [];

  if (isPending) {
    return <PaymentCategoriesSkeleton />;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold">Payment categories</h2>
      <SmallTable>
        <Table>
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className={cn(smallTableHeadClass, 'min-w-0')}>Category</TableHead>
              <TableHead className={cn(smallTableHeadClass, 'text-right')}>Rate</TableHead>
              <TableHead className={cn(smallTableHeadClass, 'w-28 text-right')}>Effective</TableHead>
              <TableHead className={cn(smallTableHeadClass, 'w-24 text-right')}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryGroups.map((group) => (
              <TableRow key={group.paymentCategoryId} className={smallTableRowClass}>
                <TableCell className={cn(smallTableCellClass, 'font-medium')}>{group.paymentCategory.name}</TableCell>
                <TableCell className={cn(smallTableCellClass, 'text-right')}>
                  <RateAmount
                    rate={group.currentRate}
                    editing={editRateId === group.currentRate.id}
                    onSettled={() => setEditRateId(null)}
                  />
                </TableCell>
                <TableCell className={cn(smallTableCellClass, 'text-right text-muted-foreground tabular-nums')}>
                  {format(group.currentRate.effectiveFrom, 'MMM yyyy')}
                </TableCell>
                <TableCell className={cn(smallTableCellClass, 'flex justify-end gap-1 text-right')}>
                  {group.rates.length > 1 && (
                    <RateDismissButton
                      rate={group.currentRate}
                      replacementAmount={getRateAfterDismiss(group.rates, group.currentRate.id, effectiveDate)?.amount}
                    />
                  )}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          aria-label="Update rate"
                          onClick={() => setEditRateId(group.currentRate.id)}
                        >
                          <Edit2 />
                        </Button>
                      }
                    />
                    <TooltipContent>Update rate</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <PopoverTrigger
                          handle={historyPopover}
                          onClick={() => setHistoryId(group.paymentCategoryId)}
                          render={
                            <Button type="button" variant="outline" size="icon-xs" aria-label="View history">
                              <HistoryIcon />
                            </Button>
                          }
                        />
                      }
                    />
                    <TooltipContent>View history</TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SmallTable>

      <Popover handle={historyPopover}>
        <PopoverContent className="w-auto" align="end">
          <SmallTable className="bg-transparent shadow-none">
            <Table>
              <TableHeader>
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className={cn(smallTableHeadClass, 'h-6')}>Amount</TableHead>
                  <TableHead className={cn(smallTableHeadClass, 'h-6 text-right')}>Effective</TableHead>
                  <TableHead className={cn(smallTableHeadClass, 'h-6 text-right')}>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRates.map((rate) => {
                  const isCurrentRate = historyRates[0]?.id === rate.id;
                  return (
                    <TableRow
                      key={rate.id}
                      className={cn(smallTableRowClass, isCurrentRate ? 'bg-primary/5' : 'opacity-60')}
                    >
                      <TableCell className={cn(smallTableCellClass, 'font-medium tabular-nums')}>
                        <span className="inline-flex items-center gap-1">
                          {currencyFormatter.format(rate.amount)}
                          {isCurrentRate && (
                            <Badge variant="default" className="scale-85">
                              Current
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className={cn(smallTableCellClass, 'text-right text-muted-foreground tabular-nums')}>
                        {format(rate.effectiveFrom, 'MMM yyyy')}
                      </TableCell>
                      <TableCell className={cn(smallTableCellClass, 'text-right text-muted-foreground tabular-nums')}>
                        {format(rate.createdAt, 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SmallTable>
        </PopoverContent>
      </Popover>
    </section>
  );
}

const rateAmountSchema = v.object({
  amount: v.pipe(
    v.string('Enter an amount'),
    v.nonEmpty('Enter an amount'),
    v.check(isValidRateAmountInput, 'Enter a valid amount'),
  ),
});

export function RateAmount(props: {
  rate: RouterOutputs['paymentCategories']['forEmployee'][number];
  editing: boolean;
  onSettled: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const createRate = useMutation(
    trpc.rates.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.paymentCategories.forEmployee.queryFilter());
      },
    }),
  );

  const formId = `rate-form-${props.rate.id}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const { effectiveDate } = useEffectiveDate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm({
    schema: rateAmountSchema,
    validate: 'submit',
    revalidate: 'input',
    initialInput: {
      amount: (props.rate.amountCents / 100).toFixed(2),
    },
  });

  const onSettled = () => {
    setConfirmOpen(false);
    props.onSettled();
    reset(form);
  };

  useEffect(() => {
    reset(form, { initialInput: { amount: (props.rate.amountCents / 100).toFixed(2) } });
  }, [effectiveDate]);

  return (
    <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
      <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {props.editing === false ? (
            <span className="text-xs font-semibold tabular-nums">{currencyFormatter.format(props.rate.amount)}</span>
          ) : (
            <Form
              id={formId}
              key={effectiveDate.toISOString()}
              of={form}
              onSubmit={async (output) => {
                if (!confirmOpen) {
                  setConfirmOpen(true);
                  return;
                }

                createRate.mutate(
                  {
                    employeeId: props.rate.employeeId,
                    paymentCategoryId: props.rate.paymentCategoryId,
                    amount: Number(output.amount),
                    effectiveFrom: effectiveDate,
                  },
                  { onSuccess: onSettled },
                );
              }}
              className="flex flex-wrap items-center justify-end gap-2"
            >
              <Field of={form} path={['amount']}>
                {(field) => (
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            aria-label="Cancel editing rate"
                            disabled={form.isSubmitting}
                            onClick={onSettled}
                          >
                            <XIcon />
                          </Button>
                        }
                      />
                      <TooltipContent>Cancel editing</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="submit"
                            size="icon-xs"
                            aria-label="Save rate"
                            disabled={form.isSubmitting || form.isDirty === false}
                          >
                            <Check />
                          </Button>
                        }
                      />
                      <TooltipContent>Confirm new rate</TooltipContent>
                    </Tooltip>
                    <Input
                      {...field.props}
                      autoFocus
                      ref={inputRef}
                      id={`rate-${props.rate.id}`}
                      className="h-5 w-20 text-right"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={field.input ?? ''}
                      onChange={(event) => field.onChange(sanitizeRateAmountInput(event.target.value))}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape' && form.isDirty === false) {
                          onSettled();
                        }
                      }}
                    />
                    <PopoverContent anchor={inputRef} side="top" className="w-auto gap-2" variant="success">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon className="size-4 text-success/70" />
                        <span className="text-success/70">Update rate?</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-muted-foreground/50 tabular-nums line-through">
                          {currencyFormatter.format(props.rate.amount)}
                        </span>
                        <ArrowRight className="size-3 shrink-0 opacity-70" aria-hidden />
                        <span className="font-semibold text-success tabular-nums">
                          {currencyFormatter.format(Number(field.input))}
                        </span>
                      </div>
                      {field.errors && <p className="text-xs text-destructive">{field.errors[0]}</p>}
                      {form.errors && <p className="text-xs text-destructive">{form.errors[0]}</p>}
                      <div className="flex flex-wrap items-center">
                        <Button
                          type="submit"
                          form={formId}
                          size="xs"
                          variant="success"
                          disabled={form.isSubmitting || form.isDirty === false}
                          aria-label="Confirm new rate"
                        >
                          {form.isSubmitting && <Loader2Icon className="size-3 animate-spin" />}
                          Confirm
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          disabled={form.isSubmitting}
                          onClick={onSettled}
                          aria-label="Discard changes"
                          className="ml-2"
                        >
                          Discard
                        </Button>
                      </div>
                    </PopoverContent>
                  </div>
                )}
              </Field>
            </Form>
          )}
        </div>
      </div>
    </Popover>
  );
}

function RateDismissButton(props: {
  rate: RouterOutputs['paymentCategories']['forEmployee'][number];
  replacementAmount?: number;
}) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const dismissRate = useMutation(
    trpc.rates.dismiss.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.paymentCategories.forEmployee.queryFilter());
        void queryClient.invalidateQueries(trpc.employees.payslips.list.queryFilter());
        void queryClient.invalidateQueries(trpc.employees.payslips.get.queryFilter());
      },
    }),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            disabled={dismissRate.isPending}
            aria-label={`Revert to previous rate from ${currencyFormatter.format(props.rate.amount)}`}
            onClick={() => setOpen(true)}
          >
            <Trash />
          </Button>
        }
      />
      <PopoverContent side="left" align="start" className="w-auto gap-2" variant="destructive">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="size-4 text-destructive/70" />
          <span className="text-destructive/70">Revert to previous rate?</span>
        </div>
        <div className="flex w-full items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground/50 tabular-nums line-through">
            {currencyFormatter.format(props.rate.amount)}
          </span>
          {props.replacementAmount != null && (
            <>
              <ArrowRight className="size-3 shrink-0 opacity-70" aria-hidden />
              <span className="font-semibold text-destructive tabular-nums">
                {currencyFormatter.format(props.replacementAmount)}
              </span>
            </>
          )}
        </div>
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            type="button"
            size="xs"
            variant="destructive"
            disabled={dismissRate.isPending}
            aria-label="Confirm revert"
            className="flex-1"
            onClick={async () => {
              await dismissRate.mutateAsync({ rateId: props.rate.id });
              setOpen(false);
            }}
          >
            {dismissRate.isPending && <Loader2Icon className="size-3 animate-spin" />}
            Revert
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={dismissRate.isPending}
            onClick={() => setOpen(false)}
            aria-label="Cancel revert"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PaymentCategoriesSkeleton() {
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
