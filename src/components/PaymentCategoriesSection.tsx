import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useViewAsOf } from '@/components/ViewAsOfProvider';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import {
  rateCreateFormFieldsSchema,
  rateCreateMutationSchema,
  type RateCreateFormOutput,
  type SelectRate,
} from '@/db/schema/rates';
import { hasConflictingRatesAt, groupCategoryRates, isRateEffectiveAt } from '@/lib/category-rates';
import { formatCurrency, formatRateAmount, parseRateAmountInput, sanitizeRateAmountInput } from '@/lib/currency';
import { useTRPC } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { Field, Form, useForm } from '@formisch/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { ChevronDown, Edit2, XIcon } from 'lucide-react';
import { useState } from 'react';
import * as v from 'valibot';
import { PaymentCategoriesSkeleton } from '@/components/loading-skeletons';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold">Payment categories</h2>
      </div>
      <div className="flex flex-col gap-3">
        {categoryGroups.map((group) => (
          <section key={group.paymentCategoryId} className="flex flex-col gap-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 text-xs font-medium">{group.paymentCategory.name}</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{formatCurrency(group.currentRate.amount)}</span>
                  <div className="flex items-center justify-between gap-1">
                    <Button variant="outline" size="icon-xs">
                      <Edit2 />
                    </Button>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Effective</span>
                  <span className="text-xs font-medium tabular-nums">
                    {format(group.currentRate.effectiveFrom, 'MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>

            <InlineRateEditor
              currentRate={group.currentRate}
              history={group.rates}
              employeeId={props.employeeId}
              viewAsOfAt={viewAsOfAt}
              onCreateRate={props.onCreateRate}
            />
          </section>
        ))}
      </div>
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
  const form = useForm({
    schema: rateCreateFormFieldsSchema,
    initialInput: {
      amountCents: formatRateAmount(props.currentRate.amountCents / 100),
      employeeId: props.employeeId,
      paymentCategoryId: props.currentRate.paymentCategoryId,
    },
    validate: 'input',
    revalidate: 'input',
  });

  return (
    <div className="flex flex-col gap-3">
      <Form
        of={form}
        onSubmit={(input) => {
          const parsed = v.parse(rateCreateMutationSchema, {
            amount: parseRateAmountInput(input.amountCents),
            employeeId: input.employeeId,
            paymentCategoryId: input.paymentCategoryId,
            effectiveFrom: startOfMonth(viewAsOfMonth),
          });
          void props.onCreateRate?.(parsed);
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Rate</span>
            <Field of={form} path={['amountCents']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="text"
                  inputMode="decimal"
                  value={field.input}
                  onChange={(event) => field.onChange(sanitizeRateAmountInput(event.target.value))}
                  aria-invalid={field.errors ? true : undefined}
                  className="w-28 aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
          </label>

          <Button type="submit" className="self-end" disabled={form.isSubmitting}>
            Change rate
          </Button>

          <Button
            type="button"
            variant={historyOpen ? 'default' : 'outline'}
            className="self-end"
            onClick={() => setHistoryOpen((open) => !open)}
          >
            Rate history
            <ChevronDown className={cn('transition-transform duration-150', { 'rotate-180': historyOpen })} />
          </Button>
        </div>
      </Form>

      {historyOpen && (
        <ul className="flex flex-col gap-1.5">
          {props.history.map((entry) => {
            const showDismiss = hasConflictingRates && isRateEffectiveAt(entry, props.viewAsOfAt);
            return (
              <li
                key={entry.id}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs',
                  props.currentRate.id !== entry.id && 'opacity-60',
                )}
              >
                <div className="flex items-center gap-1">
                  <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                  {props.currentRate.id === entry.id && <Badge variant="secondary">Current</Badge>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                    <span className="text-xs tabular-nums">Effective {format(entry.effectiveFrom, 'MMM yyyy')}</span>
                    <span className="text-xs tabular-nums">Updated {format(entry.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                  {showDismiss && (
                    <RateDismissButton
                      amount={entry.amount}
                      disabled={dismissRate.isPending}
                      onConfirm={() => dismissRate.mutate({ rateId: entry.id })}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RateDismissButton(props: { amount: number; disabled?: boolean; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={props.disabled}
            aria-label={`Dismiss ${formatCurrency(props.amount)} rate`}
            onClick={() => setOpen(true)}
          >
            <XIcon />
          </Button>
        }
      />
      <TooltipContent
        side="left"
        className="flex max-w-52 flex-col items-stretch gap-2 p-2 text-background **:text-background"
      >
        <p className="text-xs/relaxed">
          Dismiss {formatCurrency(props.amount)}? This permanently removes this rate revision for the selected view
          date.
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
