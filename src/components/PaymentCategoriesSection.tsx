import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { useViewAsOf } from '@/components/ViewAsOfProvider';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import { rateCreateMutationSchema, type RateCreateFormOutput, type SelectRate } from '@/db/schema/rates';
import {
  getLatestRateChange,
  groupCategoryRates,
  hasConflictingRatesAt,
  isRateEffectiveAt,
} from '@/lib/category-rates';
import {
  formatCurrency,
  formatRateAmount,
  isValidRateAmountInput,
  parseRateAmountInput,
  sanitizeRateAmountInput,
} from '@/lib/currency';
import { useTRPC } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { ArrowRight, Check, ChevronDown, Edit2, XIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import * as v from 'valibot';
import { PaymentCategoriesSkeleton } from '@/components/loading-skeletons';
import { Badge } from '@/components/ui/badge';
import {
  SmallTable,
  smallTableCellClass,
  smallTableHeadClass,
  smallTableRowClass,
} from '@/components/ui/compact-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function PaymentCategoriesSection(props: { employeeId: number; onCreateRate: CreateRateHandler }) {
  const trpc = useTRPC();
  const { viewAsOfAt } = useViewAsOf();
  const { data: categoryRates = [], isPending } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: viewAsOfAt }),
  );
  const categoryGroups = groupCategoryRates(categoryRates, viewAsOfAt);

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
              <TableHead className={cn(smallTableHeadClass, 'w-28')}>Effective</TableHead>
              <TableHead className={cn(smallTableHeadClass, 'text-right')}>Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryGroups.map((group) => (
              <TableRow key={group.paymentCategoryId} className={smallTableRowClass}>
                <TableCell className={cn(smallTableCellClass, 'font-medium')}>{group.paymentCategory.name}</TableCell>
                <TableCell className={cn(smallTableCellClass, 'text-muted-foreground tabular-nums')}>
                  {format(group.currentRate.effectiveFrom, 'MMM yyyy')}
                </TableCell>
                <TableCell className={cn(smallTableCellClass, 'text-right')}>
                  <InlineRateEditor
                    currentRate={group.currentRate}
                    history={group.rates}
                    employeeId={props.employeeId}
                    viewAsOfAt={viewAsOfAt}
                    onCreateRate={props.onCreateRate}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SmallTable>
    </section>
  );
}

export type InlineRateEditorRate = SelectRate & {
  amount: number;
  paymentCategory: SelectPaymentCategory;
};

export type CreateRateHandler = (input: RateCreateFormOutput) => Promise<void> | void;

export function InlineRateEditor(props: {
  currentRate: InlineRateEditorRate;
  history: InlineRateEditorRate[];
  employeeId: number;
  viewAsOfAt: Date;
  onCreateRate?: CreateRateHandler;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState(() => formatRateAmount(props.currentRate.amountCents / 100));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { viewAsOfMonth } = useViewAsOf();
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
  const hasConflictingRates = hasConflictingRatesAt(props.history, props.viewAsOfAt);
  const latestRateChange = getLatestRateChange(props.history, props.viewAsOfAt);
  const effectiveMonthLabel = format(startOfMonth(viewAsOfMonth), 'MMM yyyy');

  useEffect(() => {
    setDraftAmount(formatRateAmount(props.currentRate.amountCents / 100));
    setEditing(false);
    setSubmitError(null);
  }, [props.currentRate.id, props.currentRate.amountCents]);

  const parsedDraftAmount = parseRateAmountInput(draftAmount);
  const canSave = editing && isValidRateAmountInput(draftAmount) && parsedDraftAmount !== props.currentRate.amount;
  const hasPendingChange = canSave;

  const saveRate = () => {
    if (!canSave) return;
    setSubmitError(null);
    try {
      const parsed = v.parse(rateCreateMutationSchema, {
        amount: parseRateAmountInput(draftAmount),
        employeeId: props.employeeId,
        paymentCategoryId: props.currentRate.paymentCategoryId,
        effectiveFrom: startOfMonth(viewAsOfMonth),
      });
      void props.onCreateRate?.(parsed);
      setEditing(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Invalid rate amount');
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!editing ? (
          <>
            <span className="text-xs font-semibold tabular-nums">{formatCurrency(props.currentRate.amount)}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label="Edit rate"
              onClick={() => {
                setDraftAmount(formatRateAmount(props.currentRate.amountCents / 100));
                setEditing(true);
                setSubmitError(null);
              }}
            >
              <Edit2 />
            </Button>
            {latestRateChange && (
              <RateDismissButton
                variant="button"
                label="Dismiss latest change"
                message={
                  <>
                    Remove {formatCurrency(latestRateChange.latest.amount)} and restore{' '}
                    {formatCurrency(latestRateChange.previous.amount)} for {effectiveMonthLabel}?
                  </>
                }
                disabled={dismissRate.isPending}
                onConfirm={() => dismissRate.mutate({ rateId: latestRateChange.latest.id })}
              />
            )}
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor={`rate-${props.currentRate.id}`}>
              Rate
            </label>
            <Input
              id={`rate-${props.currentRate.id}`}
              type="text"
              inputMode="decimal"
              value={draftAmount}
              onChange={(event) => setDraftAmount(sanitizeRateAmountInput(event.target.value))}
              className="h-7 w-28"
              autoFocus
            />
            <Button type="button" size="icon-sm" aria-label="Save rate" disabled={!canSave} onClick={saveRate}>
              <Check />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel editing rate"
              onClick={() => {
                setDraftAmount(formatRateAmount(props.currentRate.amountCents / 100));
                setEditing(false);
                setSubmitError(null);
              }}
            >
              <XIcon />
            </Button>
          </>
        )}
      </div>

      {hasPendingChange && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-950 dark:text-amber-100">
          <span className="tabular-nums line-through opacity-70">{formatCurrency(props.currentRate.amount)}</span>
          <ArrowRight className="size-3 shrink-0 opacity-70" />
          <span className="font-semibold tabular-nums">{formatCurrency(parsedDraftAmount)}</span>
          <span className="text-muted-foreground">· overrides rate effective {effectiveMonthLabel}</span>
        </div>
      )}
      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

      {props.history.length > 1 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger
            render={(triggerProps, state) => (
              <Button type="button" variant="ghost" size="sm" className="h-7 w-fit px-2" {...triggerProps}>
                Previous rates
                <ChevronDown className={cn('transition-transform duration-150', { 'rotate-180': state.open })} />
              </Button>
            )}
          />
          <CollapsibleContent className="pt-2">
            <SmallTable className="bg-transparent shadow-none">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className={cn(smallTableHeadClass, 'h-6')}>Amount</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6')}>Effective</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6')}>Updated</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6 w-8')} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.history.map((entry) => {
                    const showDismiss = hasConflictingRates && isRateEffectiveAt(entry, props.viewAsOfAt);
                    return (
                      <TableRow
                        key={entry.id}
                        className={cn(
                          smallTableRowClass,
                          props.currentRate.id === entry.id ? 'bg-primary/5' : 'opacity-60',
                        )}
                      >
                        <TableCell className={cn(smallTableCellClass, 'font-medium tabular-nums')}>
                          <span className="inline-flex items-center gap-1">
                            {formatCurrency(entry.amount)}
                            {props.currentRate.id === entry.id && <Badge variant="secondary">Current</Badge>}
                          </span>
                        </TableCell>
                        <TableCell className={cn(smallTableCellClass, 'text-muted-foreground tabular-nums')}>
                          {format(entry.effectiveFrom, 'MMM yyyy')}
                        </TableCell>
                        <TableCell className={cn(smallTableCellClass, 'text-muted-foreground tabular-nums')}>
                          {format(entry.createdAt, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className={cn(smallTableCellClass, 'text-right')}>
                          {showDismiss && (
                            <RateDismissButton
                              amount={entry.amount}
                              disabled={dismissRate.isPending}
                              onConfirm={() => dismissRate.mutate({ rateId: entry.id })}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SmallTable>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function RateDismissButton(props: {
  amount?: number;
  disabled?: boolean;
  onConfirm: () => void;
  variant?: 'icon' | 'button';
  label?: string;
  message?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isButton = props.variant === 'button';

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          isButton ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              disabled={props.disabled}
              onClick={() => setOpen(true)}
            >
              {props.label ?? 'Dismiss'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              disabled={props.disabled}
              aria-label={`Dismiss ${formatCurrency(props.amount ?? 0)} rate`}
              onClick={() => setOpen(true)}
            >
              <XIcon />
            </Button>
          )
        }
      />
      <TooltipContent
        side="left"
        className="flex max-w-52 flex-col items-stretch gap-2 p-2 text-background **:text-background"
      >
        <p className="text-xs/relaxed">
          {props.message ?? (
            <>
              Dismiss {formatCurrency(props.amount ?? 0)}? This permanently removes this rate revision for the selected
              view date.
            </>
          )}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className="flex-1 bg-background/15 text-background hover:bg-background/25"
            onClick={() => {
              props.onConfirm();
              setOpen(false);
            }}
          >
            Confirm dismiss
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            className="flex-1 border-background/30 bg-transparent text-background hover:bg-background/15"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
