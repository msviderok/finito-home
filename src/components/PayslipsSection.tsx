import { MonthPickerField } from '@/components/MonthPickerField';
import { PayslipsSectionSkeleton } from '@/components/loading-skeletons';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  SmallTable,
  smallTableCellClass,
  smallTableHeadClass,
  smallTableRowClass,
} from '@/components/ui/compact-table';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useViewAsOf } from '@/components/ViewAsOfProvider';
import { payslipDraftFormSchema, sanitizeHoursInput } from '@/db/schema/payslips';
import {
  getCategoryGroupAt,
  groupCategoryRates,
  type CategoryRate,
  type CategoryRateGroup,
} from '@/lib/category-rates';
import { formatCents, formatCurrency } from '@/lib/currency';
import { formatPayslipPaymentDate, viewAsOfInstant } from '@/lib/date';
import { comparePayslipTotalsAt, getBaseRateForLineItem } from '@/lib/payslip-totals';
import { useTRPC } from '@/lib/trpc/client';
import { Field, FieldArray, Form, getInput, insert, remove, useForm } from '@formisch/react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ArrowRight, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

type CategoryOption = {
  value: number;
  label: string;
  rateAmount: number;
};

export function PayslipsSection(props: { employeeId: number; onCreatePayslip: any }) {
  const trpc = useTRPC();
  const [showForm, setShowForm] = useState(false);
  const { data: payslips = [], isPending } = useQuery(
    trpc.employees.payslips.list.queryOptions({ employeeId: props.employeeId }),
  );

  if (isPending) {
    return <PayslipsSectionSkeleton />;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold">Pay slips</h2>
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
        <p className="py-2 text-xs text-muted-foreground">No pay slips yet.</p>
      ) : (
        <SmallTable>
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className={cn(smallTableHeadClass, 'w-8 px-1')} />
                <TableHead className={smallTableHeadClass}>Month</TableHead>
                <TableHead className={cn(smallTableHeadClass, 'text-right')}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslips.map((payslip) => (
                <PayslipPanel key={payslip.id} payslipId={payslip.id} employeeId={props.employeeId} />
              ))}
            </TableBody>
          </Table>
        </SmallTable>
      )}
    </section>
  );
}

export function PayslipPanel(props: { payslipId: number; employeeId: number }) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const { viewAsOfAt, viewAsOfMonth } = useViewAsOf();
  const { data: payslip, isPending: payslipLoading } = useQuery(
    trpc.employees.payslips.get.queryOptions({ id: props.payslipId }),
  );
  const ratesEffectiveDate = useMemo(() => {
    if (!payslip) return viewAsOfAt;
    return new Date(Math.max(viewAsOfAt.getTime(), payslip.paymentDate.getTime(), payslip.createdAt.getTime()));
  }, [payslip, viewAsOfAt]);
  const { data: categoryRates = [], isPending: ratesLoading } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({
      employeeId: props.employeeId,
      effectiveDate: ratesEffectiveDate,
    }),
  );

  if (payslipLoading || ratesLoading || !payslip) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={3} className={cn(smallTableCellClass, 'py-3')}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      </TableRow>
    );
  }

  const { viewGroups, baseTotalCents, viewTotalCents, differs } = comparePayslipTotalsAt(
    payslip.lineItems,
    categoryRates,
    payslip.paymentDate,
    payslip.createdAt,
    viewAsOfAt,
  );
  const displayTotalCents = differs ? viewTotalCents : baseTotalCents;
  const viewMonthLabel = format(viewAsOfMonth, 'MMM yyyy');

  const paymentLabel = formatPayslipPaymentDate(payslip.paymentDate);

  return (
    <>
      <TableRow
        className={cn(smallTableRowClass, 'cursor-pointer')}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-label={
          differs
            ? `${paymentLabel} pay slip, ${formatCurrency(formatCents(baseTotalCents))} original, ${formatCurrency(formatCents(viewTotalCents))} at ${viewMonthLabel}`
            : `${paymentLabel} pay slip, ${formatCurrency(formatCents(displayTotalCents))}`
        }
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <TableCell className={cn(smallTableCellClass, 'w-8 px-1')}>
          <ChevronDown
            aria-hidden
            className={cn('size-3.5 text-muted-foreground transition-transform duration-150', { 'rotate-180': open })}
          />
        </TableCell>
        <TableCell className={cn(smallTableCellClass, 'font-medium tabular-nums')}>{paymentLabel}</TableCell>
        <TableCell className={cn(smallTableCellClass, 'text-right')}>
          <PayslipTotalDisplay
            baseTotalCents={baseTotalCents}
            viewTotalCents={viewTotalCents}
            differs={differs}
            viewMonthLabel={viewMonthLabel}
          />
        </TableCell>
      </TableRow>
      {open && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={3} className="p-0">
            <SmallTable className="rounded-none border-0 border-t bg-transparent shadow-none">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className={cn(smallTableHeadClass, 'h-6')}>Category</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6 text-right')}>Hours</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6 text-right')}>Rate</TableHead>
                    <TableHead className={cn(smallTableHeadClass, 'h-6 text-right')}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslip.lineItems.map((lineItem) => (
                    <PayslipLineItemRow
                      key={lineItem.id}
                      lineItem={lineItem}
                      categoryRates={categoryRates}
                      paymentDate={payslip.paymentDate}
                      createdAt={payslip.createdAt}
                      viewGroups={viewGroups}
                      totalsDiffer={differs}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className={cn(smallTableCellClass, 'text-right text-xs font-semibold')}>
                      Total
                    </TableCell>
                    <TableCell className={cn(smallTableCellClass, 'text-right')}>
                      <PayslipTotalDisplay
                        baseTotalCents={baseTotalCents}
                        viewTotalCents={viewTotalCents}
                        differs={differs}
                        viewMonthLabel={viewMonthLabel}
                        compact
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </SmallTable>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function PayslipTotalDisplay(props: {
  baseTotalCents: number;
  viewTotalCents: number;
  differs: boolean;
  viewMonthLabel: string;
  compact?: boolean;
}) {
  if (!props.differs) {
    return (
      <span className={cn('font-medium tabular-nums', props.compact && 'text-xs font-semibold')}>
        {formatCurrency(formatCents(props.baseTotalCents))}
      </span>
    );
  }

  return (
    <div className={cn('flex flex-col items-end gap-0.5', props.compact && 'text-xs')}>
      <div className="flex flex-wrap items-center justify-end gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-amber-950 dark:text-amber-100">
        <span className="tabular-nums line-through opacity-70">
          {formatCurrency(formatCents(props.baseTotalCents))}
        </span>
        <ArrowRight className="size-3 shrink-0 opacity-70" aria-hidden />
        <span className={cn('font-semibold tabular-nums', props.compact && 'text-xs')}>
          {formatCurrency(formatCents(props.viewTotalCents))}
        </span>
      </div>
      <span className="text-[0.625rem] text-muted-foreground">At {props.viewMonthLabel}</span>
    </div>
  );
}

function PayslipLineItemRow(props: {
  lineItem: {
    id: number;
    paymentCategoryId: number;
    units: string | number;
    paymentCategory?: { name: string } | null;
  };
  categoryRates: CategoryRate[];
  paymentDate: Date;
  createdAt: Date;
  viewGroups: CategoryRateGroup[];
  totalsDiffer: boolean;
}) {
  const units = Number(props.lineItem.units);
  const baseRate = getBaseRateForLineItem(
    props.categoryRates,
    props.lineItem.paymentCategoryId,
    props.paymentDate,
    props.createdAt,
  );
  const viewGroup = getCategoryGroupAt(props.viewGroups, props.lineItem.paymentCategoryId);
  const baseAmountCents = baseRate && Number.isFinite(units) ? Math.round(baseRate.amountCents * units) : 0;
  const viewAmountCents =
    viewGroup && Number.isFinite(units) ? Math.round(viewGroup.currentRate.amountCents * units) : 0;
  const lineDiffers = props.totalsDiffer && baseAmountCents !== viewAmountCents;
  const rateDiffers =
    props.totalsDiffer && baseRate && viewGroup && baseRate.amountCents !== viewGroup.currentRate.amountCents;

  return (
    <TableRow className={cn(smallTableRowClass, lineDiffers && 'bg-amber-500/5')}>
      <TableCell className={cn(smallTableCellClass, 'font-medium')}>
        {props.lineItem.paymentCategory?.name ?? 'Payment category'}
      </TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right text-muted-foreground tabular-nums')}>
        {units.toFixed(2)}
      </TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right')}>
        {rateDiffers ? (
          <PayslipAdjustedValue
            paymentValue={formatCurrency(formatCents(baseRate!.amountCents))}
            viewValue={formatCurrency(viewGroup!.currentRate.amount)}
            suffix="/hr"
          />
        ) : (
          <span className="text-muted-foreground tabular-nums">
            {baseRate ? `${formatCurrency(formatCents(baseRate.amountCents))}/hr` : '—'}
          </span>
        )}
      </TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right')}>
        {lineDiffers ? (
          <PayslipAdjustedValue
            paymentValue={formatCurrency(formatCents(baseAmountCents))}
            viewValue={formatCurrency(formatCents(viewAmountCents))}
          />
        ) : (
          <span className="font-medium tabular-nums">{formatCurrency(formatCents(baseAmountCents))}</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function PayslipAdjustedValue(props: { paymentValue: string; viewValue: string; suffix?: string }) {
  return (
    <div className="inline-flex flex-wrap items-center justify-end gap-1 text-xs text-amber-950 dark:text-amber-100">
      <span className="text-muted-foreground tabular-nums line-through opacity-70">
        {props.paymentValue}
        {props.suffix ?? ''}
      </span>
      <ArrowRight className="size-3 shrink-0 opacity-70" aria-hidden />
      <span className="font-semibold tabular-nums">
        {props.viewValue}
        {props.suffix ?? ''}
      </span>
    </div>
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
  const { data: categoryRates = [], isPending: categoriesLoading } = useQuery(
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
      className="flex flex-col gap-3 border-t border-border pt-4"
    >
      <Field of={form} path={['employeeId']}>
        {(field) => <input {...field.props} type="hidden" value={String(field.input ?? '')} />}
      </Field>
      <Field of={form} path={['paymentDate']}>
        {(field) => (
          <label className="flex flex-col gap-1 self-start">
            <span className="text-xs text-muted-foreground">Payment month</span>
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
              {categoriesLoading && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-14 w-full rounded-md" />
                  <Skeleton className="h-7 w-24" />
                </div>
              )}
              {!categoriesLoading && (
                <SmallTable>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className={smallTableHeadClass}>Category</TableHead>
                        <TableHead className={cn(smallTableHeadClass, 'text-right')}>Hours</TableHead>
                        <TableHead className={cn(smallTableHeadClass, 'text-right')}>Amount</TableHead>
                        <TableHead className={cn(smallTableHeadClass, 'w-8')} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.items.map((itemId, index) => (
                        <DraftLineItemRow
                          key={itemId}
                          form={form}
                          index={index}
                          categoryOptions={categoryOptions}
                          onRemove={() => remove(form, { path: ['lineItems'], at: index })}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </SmallTable>
              )}
              {!categoriesLoading && (
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
              )}
              {!categoriesLoading && availableOptions.length === 0 && draftItems.length > 0 && (
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
          <TableRow className={smallTableRowClass}>
            <TableCell className={cn(smallTableCellClass, 'align-top')}>
              <input {...categoryField.props} type="hidden" value={String(categoryField.input ?? '')} />
              <span className="font-medium">{category?.label ?? 'Payment category'}</span>
              {category && (
                <span className="mt-0.5 block text-muted-foreground tabular-nums">
                  {formatCurrency(category.rateAmount)}/hr
                </span>
              )}
            </TableCell>
            <TableCell className={cn(smallTableCellClass, 'align-top')}>
              <Field of={props.form} path={['lineItems', props.index, 'hours']}>
                {(hoursField) => (
                  <>
                    <Input
                      {...hoursField.props}
                      type="text"
                      inputMode="decimal"
                      value={hoursField.input ?? ''}
                      onChange={(event) => hoursField.onChange(sanitizeHoursInput(event.target.value))}
                      aria-invalid={hoursField.errors ? true : undefined}
                      className="h-7"
                    />
                    {hoursField.errors && <span className="text-destructive">{hoursField.errors[0]}</span>}
                  </>
                )}
              </Field>
            </TableCell>
            <TableCell className={cn(smallTableCellClass, 'text-right align-top')}>
              <Field of={props.form} path={['lineItems', props.index, 'hours']}>
                {(hoursField) => {
                  const hours = Number(hoursField.input);
                  const total = category && Number.isFinite(hours) ? category.rateAmount * hours : 0;
                  return (
                    <span className="font-medium tabular-nums">
                      {hoursField.input ? formatCurrency(total) : formatCurrency(0)}
                    </span>
                  );
                }}
              </Field>
            </TableCell>
            <TableCell className={cn(smallTableCellClass, 'w-8 text-right')}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={props.onRemove}
                aria-label="Remove line item"
              >
                <Trash2 />
              </Button>
            </TableCell>
          </TableRow>
        );
      }}
    </Field>
  );
}
