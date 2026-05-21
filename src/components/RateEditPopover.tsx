import { Field, Form, useForm } from '@formisch/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { rateCreateFormSchema, type RateCreateFormOutput, type SelectRate } from '@/db/schema/rates';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import { formatCurrency, formatRateAmount, sanitizeRateAmountInput } from '@/lib/currency';

function formatDateInputValue(date: Date | undefined) {
  if (!date || Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDateInputValue(value: string) {
  return value ? new Date(`${value}T00:00:00`) : new Date(Number.NaN);
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
  onCreateRate?: CreateRateHandler;
}) {
  const form = useForm({
    schema: rateCreateFormSchema,
    initialInput: {
      amountCents: formatRateAmount(props.currentRate.amountCents / 100),
      employeeId: props.employeeId,
      paymentCategoryId: props.currentRate.paymentCategoryId,
      effectiveFrom: props.currentRate.effectiveFrom,
      previousRateId: props.currentRate.id,
    },
    validate: 'input',
    revalidate: 'input',
  });

  return (
    <div className="flex flex-col gap-3">
      <Form of={form} onSubmit={(input) => props.onCreateRate?.(input)} className="flex flex-col gap-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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

          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">Effective from</span>
            <Field of={form} path={['effectiveFrom']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="date"
                  value={formatDateInputValue(field.input)}
                  onChange={(event) => field.onChange(parseDateInputValue(event.target.value))}
                  aria-invalid={field.errors ? true : undefined}
                  className="aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-muted-foreground">Effective to</span>
            <Field of={form} path={['effectiveTo']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="date"
                  value={field.input ? formatDateInputValue(field.input) : ''}
                  onChange={(event) => field.onChange(parseDateInputValue(event.target.value))}
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
