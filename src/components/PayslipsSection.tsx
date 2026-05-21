import { Field, FieldArray, Form, getInput, insert, remove, useForm } from '@formisch/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { payslipDraftFormSchema, sanitizeHoursInput } from '@/db/schema/payslips';
import { formatCurrency } from '@/lib/currency';
import type { CategoryRateGroup, Employee } from './EmployeePayrollAccordion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from './ui/combobox';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

type CategoryOption = {
  value: number;
  label: string;
  rateId: number;
  rateAmount: number;
};

export function PayslipsSection(props: { employee: Employee; categoryGroups: CategoryRateGroup[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Pay slips</h2>
        <Button type="button" size="sm" onClick={() => setShowForm((value) => !value)}>
          <Plus data-icon="inline-start" />
          Add payslip
        </Button>
      </div>

      {showForm && <AddPayslipForm employee={props.employee} categoryGroups={props.categoryGroups} />}

      {props.employee.payslips.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-muted-foreground">No pay slips yet.</p>
      ) : (
        <Accordion multiple>
          {props.employee.payslips.map((payslip) => (
            <PayslipAccordionItem key={payslip.id} payslip={payslip} />
          ))}
        </Accordion>
      )}
    </section>
  );
}

export function PayslipAccordionItem(props: { payslip: Employee['payslips'][number] }) {
  const total = props.payslip.lineItems.reduce((sum, lineItem) => sum + lineItem.totalAmount, 0);

  return (
    <AccordionItem value={`payslip-${props.payslip.id}`}>
      <AccordionTrigger className="items-center">
        <span className="font-medium tabular-nums">{props.payslip.paymentDate.toLocaleDateString()}</span>
        <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
          <Badge variant="outline">{props.payslip.lineItems.length} lines</Badge>
          <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-2">
          {props.payslip.lineItems.map((lineItem) => (
            <div
              key={lineItem.id}
              className="grid gap-2 rounded-md border px-2 py-1.5 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <span className="font-medium">{lineItem.rate.paymentCategory.name}</span>
              <span className="text-muted-foreground tabular-nums">{Number(lineItem.units).toFixed(2)} hours</span>
              <span className="text-muted-foreground tabular-nums">{formatCurrency(lineItem.rate.amount)}/hr</span>
              <span className="font-medium tabular-nums">{formatCurrency(lineItem.totalAmount)}</span>
            </div>
          ))}
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

function AddPayslipForm(props: { employee: Employee; categoryGroups: CategoryRateGroup[] }) {
  const form = useForm({
    schema: payslipDraftFormSchema,
    initialInput: {
      employeeId: props.employee.id,
      paymentDate: new Date(),
      lineItems: [],
    },
    validate: 'submit',
    revalidate: 'input',
  });
  const categoryOptions = props.categoryGroups.map((group) => ({
    value: group.paymentCategoryId,
    label: group.paymentCategory.name,
    rateId: group.currentRate.id,
    rateAmount: group.currentRate.amount,
  }));

  return (
    <Form
      of={form}
      onSubmit={(output) => {
        console.log(output);
      }}
      className="flex flex-col gap-3 rounded-md border p-3"
    >
      <Field of={form} path={['employeeId']}>
        {(field) => <input {...field.props} type="hidden" value={String(field.input ?? '')} />}
      </Field>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Payment date</span>
          <Field of={form} path={['paymentDate']}>
            {(field) => (
              <Input
                {...field.props}
                type="date"
                value={formatDateInputValue(field.input)}
                onChange={(event) => field.onChange(parseDateInputValue(event.target.value))}
                aria-invalid={field.errors ? true : undefined}
              />
            )}
          </Field>
        </label>

        <FieldArray of={form} path={['lineItems']}>
          {(lineItems) => {
            const draftItems = getInput(form, { path: ['lineItems'] }) ?? [];
            const selectedCategoryIds = new Set(draftItems.map((item) => item.paymentCategoryId).filter(Boolean));
            const availableOptions = categoryOptions.filter((option) => !selectedCategoryIds.has(option.value));

            return (
              <div className="flex flex-col gap-2">
                <PaymentCategoryCombobox
                  options={availableOptions}
                  disabled={availableOptions.length === 0}
                  onSelect={(option) => {
                    insert(form, {
                      path: ['lineItems'],
                      initialInput: {
                        paymentCategoryId: option.value,
                        rateId: option.rateId,
                        hours: '',
                      },
                    });
                  }}
                />
                {availableOptions.length === 0 && <p className="text-muted-foreground">All categories added</p>}
                {lineItems.errors && <p className="text-destructive">{lineItems.errors[0]}</p>}
              </div>
            );
          }}
        </FieldArray>
      </div>

      <FieldArray of={form} path={['lineItems']}>
        {(lineItems) => (
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
          </div>
        )}
      </FieldArray>

      <div className="flex justify-end">
        <Button type="submit" disabled={form.isSubmitting}>
          Log payslip
        </Button>
      </div>
    </Form>
  );
}

function PaymentCategoryCombobox(props: {
  options: CategoryOption[];
  disabled: boolean;
  onSelect: (option: CategoryOption) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const filteredOptions = props.options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.trim().toLowerCase()),
  );

  return (
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
      <ComboboxInput
        disabled={props.disabled}
        placeholder="Add payment category"
        className="w-full"
        showClear={inputValue.length > 0}
      />
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
            <Field of={props.form} path={['lineItems', props.index, 'rateId']}>
              {(rateField) => <input {...rateField.props} type="hidden" value={String(rateField.input ?? '')} />}
            </Field>
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
