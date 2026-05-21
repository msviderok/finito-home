import { Field, Form, useForm } from '@formisch/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rateCreateFormSchema, type RateCreateFormOutput, type SelectRate } from '@/db/schema/rates';
import type { SelectPaymentCategory } from '@/db/schema/paymentCategories';
import { formatCurrency, formatRateAmount, sanitizeRateAmountInput } from '@/lib/currency';
import { trpc } from '@/router';
import { useQuery } from '@tanstack/react-query';
import { Edit2 } from 'lucide-react';
import { Separator } from './ui/separator';

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

export function RateEditPopover(props: {
  rate: SelectRate & { paymentCategory: SelectPaymentCategory };
  employeeId: number;
  open: boolean;
  editDisabled: boolean;
  onEditClick: () => void;
  onStopEditing: () => void;
  onCreateRate?: (input: RateCreateFormOutput) => void;
}) {
  const { data: history = [] } = useQuery(
    trpc.getRateHistory.queryOptions({
      employeeId: props.employeeId,
      paymentCategoryId: props.rate.paymentCategoryId,
    }),
  );
  const form = useForm({
    schema: rateCreateFormSchema,
    initialInput: {
      amountCents: formatRateAmount(props.rate.amountCents / 100),
      employeeId: props.employeeId,
      paymentCategoryId: props.rate.paymentCategoryId,
      effectiveFrom: props.rate.effectiveFrom,
      previousRateId: props.rate.id,
    },
    validate: 'input',
    revalidate: 'input',
  });

  return (
    <Popover
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onStopEditing();
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button size="icon-xs" disabled={props.editDisabled} onClick={props.onEditClick}>
                  <Edit2 className="size-3" />
                </Button>
              }
            />
          }
        />
        <TooltipContent align="start">
          <p>Edit rate</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom" align="start" className="w-full max-w-xs">
        <Form of={form} onSubmit={(input) => props.onCreateRate?.(input)} className="flex flex-col gap-3">
          <PopoverHeader>
            <PopoverTitle>"{props.rate.paymentCategory.name}" changes history</PopoverTitle>
          </PopoverHeader>
          <div className="grid grid-cols-4 gap-2">
            <Field of={form} path={['amountCents']}>
              {(field) => (
                <Input
                  {...field.props}
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={field.input}
                  onChange={(e) => field.onChange(sanitizeRateAmountInput(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') props.onStopEditing();
                  }}
                  aria-invalid={field.errors ? true : undefined}
                  className="col-span-3 aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
            <Button type="submit" size="default" className="self-end" disabled={form.isSubmitting}>
              Add rate
            </Button>

            <Field of={form} path={['effectiveFrom']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="date"
                  value={formatDateInputValue(field.input)}
                  onChange={(e) => field.onChange(parseDateInputValue(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') props.onStopEditing();
                  }}
                  aria-invalid={field.errors ? true : undefined}
                  className="col-span-2 aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
            <Field of={form} path={['effectiveTo']}>
              {(field) => (
                <Input
                  {...field.props}
                  type="date"
                  value={field.input ? formatDateInputValue(field.input) : ''}
                  onChange={(e) => field.onChange(parseDateInputValue(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') props.onStopEditing();
                  }}
                  aria-invalid={field.errors ? true : undefined}
                  className="col-span-2 aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Rate history</p>
            <ul className="mb-3 flex flex-col gap-1.5">
              {history.map((entry, idx) => (
                <li key={entry.id} className="flex items-center justify-between gap-2">
                  <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                  <div className="flex items-center gap-1.5">
                    {idx === 0 && (
                      <Badge variant="default" className="shrink-0">
                        Current
                      </Badge>
                    )}
                    <span className="text-muted-foreground">{entry.effectiveFrom.toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
