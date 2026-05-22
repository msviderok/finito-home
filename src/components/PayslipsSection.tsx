import { MonthPickerField } from '@/components/MonthPickerField';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useViewAsOf } from '@/components/ViewAsOfProvider';
import { payslipDraftFormSchema, sanitizeHoursInput } from '@/db/schema/payslips';
import { getCategoryGroupAt, groupCategoryRates } from '@/lib/category-rates';
import { formatCurrency } from '@/lib/currency';
import { formatPayslipPaymentDate, viewAsOfInstant } from '@/lib/date';
import { useTRPC } from '@/lib/trpc/client';
import { Field, FieldArray, Form, getInput, insert, remove, useForm } from '@formisch/react';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type CategoryOption = {
  value: number;
  label: string;
  rateAmount: number;
};

export function PayslipsSection(props: { employeeId: number; onCreatePayslip: any }) {
  const trpc = useTRPC();
  const [showForm, setShowForm] = useState(false);
  const { data: payslips = [] } = useQuery(trpc.employees.payslips.list.queryOptions({ employeeId: props.employeeId }));

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Pay slips</h2>
        {showForm ? (
          <Button type="submit" form="add-payslip-form" size="sm">
            Save
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={() => setShowForm(true)}>
            Create Payslip
          </Button>
        )}
      </div>

      {showForm && (
        <AddPayslipForm
          employeeId={props.employeeId}
          onCreatePayslip={async (input: any) => {
            await props.onCreatePayslip(input);
            setShowForm(false);
          }}
        />
      )}

      {payslips.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-muted-foreground">No pay slips yet.</p>
      ) : (
        <Accordion multiple defaultValue={payslips.map((payslip) => `payslip-${payslip.id}`)}>
          {payslips.map((payslip) => (
            <PayslipAccordionItem key={payslip.id} payslipId={payslip.id} employeeId={props.employeeId} />
          ))}
        </Accordion>
      )}
    </section>
  );
}

export function PayslipAccordionItem(props: { payslipId: number; employeeId: number }) {
  const trpc = useTRPC();
  const { viewAsOfAt } = useViewAsOf();
  const { data: payslip } = useQuery(trpc.employees.payslips.get.queryOptions({ id: props.payslipId }));
  const { data: categoryRates = [] } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: viewAsOfAt }),
  );
  const categoryGroups = payslip ? groupCategoryRates(categoryRates, payslip.paymentDate) : [];

  if (!payslip) return null;

  const total = payslip.lineItems.reduce((sum, lineItem) => {
    const group = getCategoryGroupAt(categoryGroups, lineItem.paymentCategoryId);
    return sum + (group ? group.currentRate.amount * Number(lineItem.units) : 0);
  }, 0);

  return (
    <AccordionItem value={`payslip-${payslip.id}`}>
      <AccordionTrigger className="items-center">
        <span className="font-medium tabular-nums">{formatPayslipPaymentDate(payslip.paymentDate)}</span>
        <span className="ml-auto font-medium text-muted-foreground tabular-nums">{formatCurrency(total)}</span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2">
          {payslip.lineItems.map((lineItem) => {
            const group = getCategoryGroupAt(categoryGroups, lineItem.paymentCategoryId);
            const lineTotal = group ? group.currentRate.amount * Number(lineItem.units) : 0;
            return (
              <div
                key={lineItem.id}
                className="grid gap-2 rounded-md border px-2 py-1.5 sm:grid-cols-[1fr_auto_auto_auto]"
              >
                <span className="font-medium">{lineItem.paymentCategory?.name ?? 'Payment category'}</span>
                <span className="text-muted-foreground tabular-nums">{Number(lineItem.units).toFixed(2)} hours</span>
                <span className="text-muted-foreground tabular-nums">
                  {group ? `${formatCurrency(group.currentRate.amount)}/hr` : '—'}
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(lineTotal)}</span>
              </div>
            );
          })}
          <Separator />
          <div className="flex justify-end gap-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function AddPayslipForm(props: { employeeId: number; onCreatePayslip: any }) {
  const trpc = useTRPC();
  const { viewAsOfMonth } = useViewAsOf();
  const form = useForm({
    schema: payslipDraftFormSchema,
    initialInput: {
      employeeId: props.employeeId,
      paymentDate: viewAsOfMonth,
      lineItems: [],
    },
    validate: 'submit',
    revalidate: 'input',
  });
  const paymentMonth = getInput(form, { path: ['paymentDate'] });
  const paymentAt = useMemo(() => {
    const month =
      paymentMonth instanceof Date && !Number.isNaN(paymentMonth.getTime())
        ? startOfMonth(paymentMonth)
        : viewAsOfMonth;
    return viewAsOfInstant(month);
  }, [paymentMonth, viewAsOfMonth]);
  const { data: categoryRates = [] } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId, effectiveDate: paymentAt }),
  );
  const categoryGroups = groupCategoryRates(categoryRates ?? [], paymentAt);
  const categoryOptions = categoryGroups.map((group) => ({
    value: group.paymentCategoryId,
    label: group.paymentCategory.name,
    rateAmount: group.currentRate.amount,
  }));

  return (
    <Form
      id="add-payslip-form"
      of={form}
      onSubmit={async (output) => {
        await props.onCreatePayslip({
          ...output,
          paymentDate: viewAsOfInstant(startOfMonth(output.paymentDate)),
        });
      }}
      className="flex flex-col gap-3 rounded-md border p-3"
    >
      <Field of={form} path={['employeeId']}>
        {(field) => <input {...field.props} type="hidden" value={String(field.input ?? '')} />}
      </Field>
      <Field of={form} path={['paymentDate']}>
        {(field) => (
          <label className="flex flex-col gap-1 self-start">
            <span className="text-muted-foreground">Payment month</span>
            <MonthPickerField
              aria-label="Payment month"
              value={
                field.input instanceof Date && !Number.isNaN(field.input.getTime())
                  ? startOfMonth(field.input)
                  : viewAsOfMonth
              }
              onChange={(month) => field.onChange(month)}
            />
          </label>
        )}
      </Field>
      <FieldArray of={form} path={['lineItems']}>
        {(lineItems) => {
          const draftItems = getInput(form, { path: ['lineItems'] }) ?? [];
          const selectedCategoryIds = new Set(draftItems.map((item) => item.paymentCategoryId).filter(Boolean));
          const availableOptions = categoryOptions.filter((option) => !selectedCategoryIds.has(option.value));

          return (
            <div className="flex flex-col gap-2">
              {lineItems.items.map((itemId, index) => (
                <DraftLineItemRow
                  key={itemId}
                  form={form}
                  index={index}
                  categoryOptions={categoryOptions}
                  onRemove={() => remove(form, { path: ['lineItems'], at: index })}
                />
              ))}
              <AddPaymentControl
                options={availableOptions}
                onSelect={(option) => {
                  insert(form, {
                    path: ['lineItems'],
                    initialInput: {
                      paymentCategoryId: option.value,
                      hours: '',
                    },
                  });
                }}
              />
              {availableOptions.length === 0 && draftItems.length > 0 && (
                <p className="text-muted-foreground">All categories added</p>
              )}
              {lineItems.errors && <p className="text-destructive">{lineItems.errors[0]}</p>}
            </div>
          );
        }}
      </FieldArray>
    </Form>
  );
}

function AddPaymentControl(props: { options: CategoryOption[]; onSelect: (option: CategoryOption) => void }) {
  const [selectingCategory, setSelectingCategory] = useState(false);

  if (props.options.length === 0) return null;

  if (selectingCategory) {
    return (
      <PaymentCategoryCombobox
        options={props.options}
        onSelect={(option) => {
          props.onSelect(option);
          setSelectingCategory(false);
        }}
        onCancel={() => setSelectingCategory(false)}
      />
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setSelectingCategory(true)}>
      <Plus data-icon="inline-start" />
      Add payment
    </Button>
  );
}

function PaymentCategoryCombobox(props: {
  options: CategoryOption[];
  onSelect: (option: CategoryOption) => void;
  onCancel?: () => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const filteredOptions = props.options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <Combobox<CategoryOption>
        value={null}
        inputValue={inputValue}
        itemToStringLabel={(option) => option.label}
        onInputValueChange={setInputValue}
        onValueChange={(option) => {
          if (!option) return;
          props.onSelect(option);
          setInputValue('');
        }}
      >
        <ComboboxInput placeholder="Select category" className="w-full" showClear={inputValue.length > 0} />
        <ComboboxContent>
          <ComboboxList>
            {filteredOptions.map((option) => (
              <ComboboxItem key={option.value} value={option}>
                <span className="flex-1">{option.label}</span>
                <span className="text-muted-foreground tabular-nums">{formatCurrency(option.rateAmount)}/hr</span>
              </ComboboxItem>
            ))}
          </ComboboxList>
          <ComboboxEmpty>No categories available</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      {props.onCancel && (
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={props.onCancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}

function DraftLineItemRow(props: {
  form: ReturnType<typeof useForm<typeof payslipDraftFormSchema>>;
  index: number;
  categoryOptions: CategoryOption[];
  onRemove: () => void;
}) {
  return (
    <Field of={props.form} path={['lineItems', props.index, 'paymentCategoryId']}>
      {(categoryField) => {
        const category = props.categoryOptions.find((option) => option.value === categoryField.input);
        return (
          <div className="grid items-end gap-2 rounded-md border px-2 py-2 sm:grid-cols-[1fr_auto_8rem_auto_auto]">
            <input {...categoryField.props} type="hidden" value={String(categoryField.input ?? '')} />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{category?.label ?? 'Payment category'}</span>
              <span className="text-muted-foreground tabular-nums">
                {category ? `${formatCurrency(category.rateAmount)}/hr` : ''}
              </span>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-muted-foreground">Hours</span>
              <Field of={props.form} path={['lineItems', props.index, 'hours']}>
                {(hoursField) => {
                  const hours = Number(hoursField.input);
                  const total = category && Number.isFinite(hours) ? category.rateAmount * hours : 0;
                  return (
                    <>
                      <Input
                        {...hoursField.props}
                        type="text"
                        inputMode="decimal"
                        value={hoursField.input ?? ''}
                        onChange={(event) => hoursField.onChange(sanitizeHoursInput(event.target.value))}
                        aria-invalid={hoursField.errors ? true : undefined}
                      />
                      {hoursField.errors && <span className="text-destructive">{hoursField.errors[0]}</span>}
                      <span className="sr-only">{formatCurrency(total)}</span>
                    </>
                  );
                }}
              </Field>
            </label>
            <Field of={props.form} path={['lineItems', props.index, 'hours']}>
              {(hoursField) => {
                const hours = Number(hoursField.input);
                const total = category && Number.isFinite(hours) ? category.rateAmount * hours : 0;
                return (
                  <span className="pb-1 font-medium tabular-nums">
                    {hoursField.input ? formatCurrency(total) : formatCurrency(0)}
                  </span>
                );
              }}
            </Field>
            <Button type="button" variant="ghost" size="icon-sm" onClick={props.onRemove} aria-label="Remove line item">
              <Trash2 />
            </Button>
          </div>
        );
      }}
    </Field>
  );
}
