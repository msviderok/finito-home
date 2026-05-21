import { Field, Form, useForm } from '@formisch/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useViewAsOf } from '@/contexts/view-as-of';
import {
  parseRateCreateMutation,
  rateCreateFormFieldsSchema,
  type RateCreateFormOutput,
  type SelectRate,
} from '@/db/schema/rates';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import { formatCurrency, formatRateAmount, sanitizeRateAmountInput } from '@/lib/currency';

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
      previousRateId: props.currentRate.id,
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
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-md border px-2 py-1.5">
              <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
              <div className="flex items-center gap-1.5">
                {entry.id === props.currentRate.id && (
                  <Badge variant="default" className="shrink-0">
                    Current
                  </Badge>
                )}
                <span className="text-muted-foreground tabular-nums">{entry.effectiveFrom.toLocaleDateString()}</span>
                {entry.effectiveTo && (
                  <span className="text-muted-foreground tabular-nums">- {entry.effectiveTo.toLocaleDateString()}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
