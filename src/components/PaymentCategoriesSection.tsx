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
import { groupCategoryRates } from '@/lib/category-rates';
import { formatCurrency, formatRateAmount, parseRateAmountInput, sanitizeRateAmountInput } from '@/lib/currency';
import { useTRPC } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { Field, Form, useForm } from '@formisch/react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { ChevronDown, Edit2 } from 'lucide-react';
import * as v from 'valibot';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

export function PaymentCategoriesSection(props: { employeeId: number; onCreateRate: CreateRateHandler }) {
  const trpc = useTRPC();
  const { viewAsOfAt } = useViewAsOf();
  const { data: categoryRates = [] } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: viewAsOfAt }),
  );
  const categoryGroups = groupCategoryRates(categoryRates, viewAsOfAt);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Payment categories</h2>
      </div>
      <Accordion multiple>
        {categoryGroups.map((group) => (
          <AccordionItem key={group.paymentCategoryId} value={`category-${group.paymentCategoryId}`}>
            <AccordionTrigger className="flex items-center gap-2">
              <span className="flex-1 font-medium">{group.paymentCategory.name}</span>
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
                  <span className="text-muted-foreground/60">Effective</span>
                  <span className="font-bold">{format(group.currentRate.effectiveFrom, 'MMM yyyy')}</span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <InlineRateEditor
                currentRate={group.currentRate}
                history={group.rates}
                employeeId={props.employeeId}
                onCreateRate={props.onCreateRate}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
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
    <Collapsible className="flex flex-col gap-3">
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
        <div className="flex items-end gap-2">
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
                  className="w-28 aria-invalid:ring-destructive/30"
                />
              )}
            </Field>
          </label>

          <Button type="submit" className="self-end" disabled={form.isSubmitting}>
            Change rate
          </Button>

          <CollapsibleTrigger
            render={(props, state) => (
              <Button variant={state.open ? 'default' : 'outline'} {...props}>
                Rate History{' '}
                <ChevronDown className={cn('transition-transform duration-150', { 'rotate-180': state.open })} />
              </Button>
            )}
          />
        </div>
      </Form>

      <CollapsibleContent>
        <ul className="flex flex-col gap-1.5">
          {props.history.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                'relative flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm',
                props.currentRate.id !== entry.id && 'bg-muted/50 opacity-20',
              )}
            >
              <div className="item-center flex gap-1">
                <span className="font-medium tabular-nums">{formatCurrency(entry.amount)}</span>
                {props.currentRate.id === entry.id && <Badge className="scale-80">Current</Badge>}
              </div>

              <div className="flex gap-2 text-muted-foreground">
                <span className="text-[10px] text-muted-foreground italic tabular-nums">
                  Effective {format(entry.effectiveFrom, 'MMM yyyy')}
                </span>
                <span className="text-[10px] text-muted-foreground italic tabular-nums">
                  Updated {format(entry.createdAt, 'MMMM d, yyyy')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
