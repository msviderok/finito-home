import { Field, Form, useForm } from '@formisch/react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useViewAsOf } from '@/contexts/ViewAsOfProvider';
import {
  parseRateCreateMutation,
  rateCreateFormFieldsSchema,
  type RateCreateFormOutput,
  type SelectRate,
} from '@/db/schema/rates';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import { formatCurrency, formatRateAmount, sanitizeRateAmountInput } from '@/lib/currency';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export type InlineRateEditorRate = SelectRate & {
  amount: number;
  paymentCategory: SelectPaymentCategory;
};

export type CreateRateHandler = (input: RateCreateFormOutput) => Promise<void> | void;

export function InlineRateEditor(props: {
  currentRate: InlineRateEditorRate;
  history: InlineRateEditorRate[];
  employeeId: number;
  onCreateRate?: CreateRateHandler;
}) {
  const { viewAsOfMonth } = useViewAsOf();
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
        onSubmit={(input) => props.onCreateRate?.(parseRateCreateMutation(input, viewAsOfMonth))}
        className="flex flex-col gap-3"
      >
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">Rate</span>
            <Field of={form} path={['amountCents']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="text"
                  inputMode="decimal"
                  value={field.input}
                  onChange={(event) => field.onChange(sanitizeRateAmountInput(event.target.value))}
                  aria-invalid={field.errors ? true : undefined}
                  className="aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
          </label>

          <Button type="submit" className="self-end" disabled={form.isSubmitting}>
            Add rate
          </Button>
        </div>
      </Form>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Rate history</p>
        <ul className="flex flex-col gap-1.5">
          {props.history.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                'relative flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm',
                props.currentRate.id !== entry.id && 'bg-muted/50 opacity-20',
              )}
            >
              <div className="item-center flex gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                </div>
                <Separator orientation="vertical" className="ml-auto h-4" />
                <p className="text-muted-foreground tabular-nums">
                  As of{' '}
                  <Badge variant="outline">
                    <span className="font-medium">{formatRateEffectiveFrom(entry.effectiveFrom)}</span>
                  </Badge>
                </p>
              </div>

              <div className="flex gap-2 text-muted-foreground">
                <span className="text-xs text-muted-foreground italic tabular-nums">
                  Updated {formatRateChangedAt(entry.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatRateChangedAt(date: Date) {
  return format(date, 'MMMM d, yyyy');
}

function formatRateEffectiveFrom(date: Date) {
  return format(date, 'MMM yyyy');
}
