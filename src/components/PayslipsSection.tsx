import { MonthPickerField } from '@/components/MonthPickerField';
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
import { useEffectiveDate } from '@/lib/hooks/useEffectiveDate';
import { payslipDraftFormSchema, sanitizeHoursInput } from '@/db/schema/payslips';
import {
  getCategoryGroupAt,
  groupCategoryRates,
  type CategoryRate,
  type CategoryRateGroup,
} from '@/lib/category-rates';
import { formatCents, formatCurrency } from '@/lib/currency';
import { formatPayslipPaymentDate, viewAsOfInstant } from '@/lib/date';
import { comparePayslipTotalsAt, getLineBaseAmountCents, getLineBaseRateCents } from '@/lib/payslip-totals';
import { useTRPC } from '@/lib/trpc/client';
import { Field, FieldArray, Form, getInput, insert, remove, useForm } from '@formisch/react';
import { useQuery } from '@tanstack/react-query';
import { parse, format, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type CategoryOption = {
  value: number;
  label: string;
  rateAmount: number;
};

export function PayslipsSection(props: { employeeId: number; onCreatePayslip: any }) {
  const trpc = useTRPC();
  const { effectiveDate } = useEffectiveDate();
  const [showForm, setShowForm] = useState(false);
  const [draftPaymentMonth, setDraftPaymentMonth] = useState<Date | null>(null);
  const [hasLineItems, setHasLineItems] = useState(false);
  const { data: payslips = [], isPending } = useQuery(
    trpc.employees.payslips.list.queryOptions({ employeeId: props.employeeId }),
  );

  const closeForm = () => {
    setShowForm(false);
    setDraftPaymentMonth(null);
    setHasLineItems(false);
  };

  if (isPending) {
    return <PayslipsSectionSkeleton />;
  }

  const creatingForMonth = startOfMonth(draftPaymentMonth ?? effectiveDate);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-xs font-semibold">Payslips</h2>
          {showForm && (
            <>
              <span className="h-3 w-px shrink-0 bg-border" aria-hidden />
              <p className="text-xs">
                New for <span className="font-bold">{format(creatingForMonth, 'MMM yyyy')}</span>
              </p>
            </>
          )}
        </div>
        {showForm ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" form="add-payslip-form" size="sm" disabled={!hasLineItems}>
              Save
            </Button>
          </div>
        ) : (
          <MonthPickerField
            size="sm"
            variant="default"
            label="Create Payslip"
            aria-label="Create Payslip"
            value={effectiveDate}
            onChange={(value) => {
              setDraftPaymentMonth(parse(value, 'MM-yyyy', new Date(2000, 0, 1)));
              setHasLineItems(false);
              setShowForm(true);
            }}
          />
        )}
      </div>

      {showForm && (
        <AddPayslipForm
          employeeId={props.employeeId}
          initialPaymentDate={draftPaymentMonth ?? effectiveDate}
          onHasLineItemsChange={setHasLineItems}
          onCreatePayslip={async (input: any) => {
            await props.onCreatePayslip(input);
            closeForm();
          }}
        />
      )}

      {payslips.length === 0 ? (
        <div className="rounded-md border px-2 py-6 text-center text-xs text-muted-foreground">No payslips yet</div>
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
  const { effectiveDate } = useEffectiveDate();
  const { data: payslip, isPending: payslipLoading } = useQuery(
    trpc.employees.payslips.get.queryOptions({ id: props.payslipId }),
  );
  const { data: categoryRates = [], isPending: ratesLoading } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({
      employeeId: props.employeeId,
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
    effectiveDate,
  );
  const displayTotalCents = differs ? viewTotalCents : baseTotalCents;
  const viewMonthLabel = format(effectiveDate, 'MMM yyyy');

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
            ? `${paymentLabel} payslip, ${formatCurrency(formatCents(baseTotalCents))} original, ${formatCurrency(formatCents(viewTotalCents))} at ${viewMonthLabel}`
            : `${paymentLabel} payslip, ${formatCurrency(formatCents(displayTotalCents))}`
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
        <TableCell className={cn(smallTableCellClass, 'font-medium')}>{paymentLabel}</TableCell>
        <TableCell className={cn(smallTableCellClass, 'text-right')}>
          <PayslipTotalDisplay baseTotalCents={baseTotalCents} viewTotalCents={viewTotalCents} differs={differs} />
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
  compact?: boolean;
}) {
  const baseTotal = formatCurrency(formatCents(props.baseTotalCents));
  const viewTotal = formatCurrency(formatCents(props.viewTotalCents));

  return props.differs ? (
    <div className="flex flex-col justify-end gap-0">
      <span className={cn('font-medium', props.compact && 'text-xs font-semibold')}>{viewTotal}</span>
      <span className="text-[0.5rem] text-muted-foreground">({baseTotal} at the time of creation)</span>
    </div>
  ) : (
    <span className={cn('font-medium', props.compact && 'text-xs font-semibold')}>{viewTotal}</span>
  );
}

function PayslipLineItemRow(props: {
  lineItem: {
    id: number;
    paymentCategoryId: number;
    units: string | number;
    createAtAmountCents?: number | null;
    paymentCategory?: { name: string } | null;
  };
  categoryRates: CategoryRate[];
  paymentDate: Date;
  createdAt: Date;
  viewGroups: CategoryRateGroup[];
  totalsDiffer: boolean;
}) {
  const units = Number(props.lineItem.units);
  const viewGroup = getCategoryGroupAt(props.viewGroups, props.lineItem.paymentCategoryId);
  const baseAmountCents = getLineBaseAmountCents(
    props.lineItem,
    props.categoryRates,
    props.paymentDate,
    props.createdAt,
  );
  const baseRateCents = getLineBaseRateCents(props.lineItem, props.categoryRates, props.paymentDate, props.createdAt);
  const viewAmountCents =
    viewGroup && Number.isFinite(units) ? Math.round(viewGroup.currentRate.amountCents * units) : 0;
  const lineDiffers = props.totalsDiffer && baseAmountCents !== viewAmountCents;
  const rateDiffers =
    props.totalsDiffer && baseRateCents != null && viewGroup && baseRateCents !== viewGroup.currentRate.amountCents;

  return (
    <TableRow className={smallTableRowClass}>
      <TableCell className={cn(smallTableCellClass, 'font-medium')}>
        {props.lineItem.paymentCategory?.name ?? 'Payment category'}
      </TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right text-muted-foreground')}>{units.toFixed(2)}</TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right')}>
        {rateDiffers ? (
          <PayslipAdjustedValue
            paymentValue={formatCurrency(formatCents(baseRateCents!))}
            viewValue={formatCurrency(viewGroup!.currentRate.amount)}
            valueClass="text-muted-foreground"
            suffix="/hr"
          />
        ) : (
          <span className="text-muted-foreground">
            {baseRateCents != null ? `${formatCurrency(formatCents(baseRateCents))}/hr` : '—'}
          </span>
        )}
      </TableCell>
      <TableCell className={cn(smallTableCellClass, 'text-right')}>
        {lineDiffers ? (
          <PayslipAdjustedValue
            paymentValue={formatCurrency(formatCents(baseAmountCents))}
            viewValue={formatCurrency(formatCents(viewAmountCents))}
            valueClass="font-medium"
          />
        ) : (
          <span className="font-medium">{formatCurrency(formatCents(baseAmountCents))}</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function PayslipAdjustedValue(props: {
  paymentValue: string;
  viewValue: string;
  suffix?: string;
  valueClass?: string;
}) {
  const suffix = props.suffix ?? '';
  return (
    <div className="flex flex-col justify-end gap-0">
      <span className={cn(props.valueClass)}>
        {props.viewValue}
        {suffix}
      </span>
      <span className="text-[0.5rem] text-muted-foreground">
        ({props.paymentValue}
        {suffix} at the time of creation)
      </span>
    </div>
  );
}

function AddPayslipForm(props: {
  employeeId: number;
  initialPaymentDate: Date;
  onHasLineItemsChange: (hasLineItems: boolean) => void;
  onCreatePayslip: any;
}) {
  const trpc = useTRPC();
  const { effectiveDate } = useEffectiveDate();
  const form = useForm({
    schema: payslipDraftFormSchema,
    initialInput: {
      employeeId: props.employeeId,
      paymentDate: props.initialPaymentDate,
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
        : effectiveDate;
    return viewAsOfInstant(month);
  }, [paymentMonth, effectiveDate]);
  const { data: categoryRates = [], isPending: categoriesLoading } = useQuery(
    trpc.paymentCategories.forEmployee.queryOptions({ employeeId: props.employeeId }),
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
      className="flex flex-col gap-2"
    >
      <Field of={form} path={['employeeId']}>
        {(field) => <input {...field.props} type="hidden" value={String(field.input ?? '')} />}
      </Field>
      <FieldArray of={form} path={['lineItems']}>
        {(lineItems) => {
          const draftItems = getInput(form, { path: ['lineItems'] }) ?? [];
          const selectedCategoryIds = new Set(draftItems.map((item) => item.paymentCategoryId).filter(Boolean));
          const availableOptions = categoryOptions.filter((option) => !selectedCategoryIds.has(option.value));
          const hasItems = lineItems.items.length > 0;
          const draftTotal = draftItems.reduce((total, item) => {
            const category = categoryOptions.find((option) => option.value === item.paymentCategoryId);
            const hours = Number(item.hours);
            if (category && Number.isFinite(hours)) {
              return total + category.rateAmount * hours;
            }
            return total;
          }, 0);

          if (categoriesLoading) {
            return (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-7 w-24" />
              </div>
            );
          }

          return (
            <>
              <LineItemsSync hasItems={hasItems} onChange={props.onHasLineItemsChange} />
              <SmallTable>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className={cn(smallTableHeadClass, 'min-w-0')}>Category</TableHead>
                      <TableHead className={cn(smallTableHeadClass, 'text-right')}>Hours</TableHead>
                      <TableHead className={cn(smallTableHeadClass, 'w-28 text-right')}>Amount</TableHead>
                      <TableHead className={cn(smallTableHeadClass, 'w-2 text-right')} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.items.map((itemId, index) => (
                      <Field key={itemId} of={form} path={['lineItems', index, 'paymentCategoryId']}>
                        {(categoryField) => {
                          const category = categoryOptions.find((option) => option.value === categoryField.input)!;
                          return (
                            <TableRow className={smallTableRowClass}>
                              <TableCell className={cn(smallTableCellClass, 'align-middle')}>
                                <input {...categoryField.props} type="hidden" value={categoryField.input ?? ''} />
                                <div className="flex flex-col gap-0">
                                  <span className="font-medium">{category.label}</span>
                                  {category && (
                                    <span className="text-[12px] text-muted-foreground">
                                      {formatCurrency(category.rateAmount)}/hr
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={cn(smallTableCellClass, 'text-right align-middle')}>
                                <Field of={form} path={['lineItems', index, 'hours']}>
                                  {(hoursField) => (
                                    <Input
                                      {...hoursField.props}
                                      autoFocus
                                      type="text"
                                      inputMode="decimal"
                                      placeholder="0.00"
                                      value={hoursField.input ?? ''}
                                      onChange={(event) => hoursField.onChange(sanitizeHoursInput(event.target.value))}
                                      aria-invalid={hoursField.errors ? true : undefined}
                                      className="h-5 w-20 text-right"
                                    />
                                  )}
                                </Field>
                              </TableCell>
                              <TableCell className={cn(smallTableCellClass, 'text-right align-middle')}>
                                <Field of={form} path={['lineItems', index, 'hours']}>
                                  {(hoursField) => {
                                    const hours = Number(hoursField.input);
                                    const total = category && Number.isFinite(hours) ? category.rateAmount * hours : 0;
                                    return (
                                      <span className="font-medium">
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
                                  aria-label="Remove line item"
                                  onClick={() => remove(form, { path: ['lineItems'], at: index })}
                                >
                                  <X />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        }}
                      </Field>
                    ))}
                    {availableOptions.length > 0 && (
                      <AddPaymentRow
                        options={availableOptions}
                        onSelect={(option) =>
                          insert(form, {
                            path: ['lineItems'],
                            initialInput: { paymentCategoryId: option.value, hours: '' },
                          })
                        }
                      />
                    )}
                  </TableBody>
                  {hasItems && (
                    <TableFooter>
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={3} className={cn(smallTableCellClass, 'text-right text-xs font-semibold')}>
                          Total
                        </TableCell>
                        <TableCell className={cn(smallTableCellClass, 'text-right')}>
                          <span className="text-xs font-semibold">{formatCurrency(draftTotal)}</span>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </SmallTable>
            </>
          );
        }}
      </FieldArray>
    </Form>
  );
}

function LineItemsSync(props: { hasItems: boolean; onChange: (hasItems: boolean) => void }) {
  useEffect(() => {
    props.onChange(props.hasItems);
  }, [props.hasItems]);
  useEffect(() => {
    return () => props.onChange(false);
  }, []);
  return null;
}

function AddPaymentRow(props: { options: CategoryOption[]; onSelect: (option: CategoryOption) => void }) {
  const [selectingCategory, setSelectingCategory] = useState(false);
  if (selectingCategory) {
    return (
      <TableRow className={smallTableRowClass}>
        <TableCell colSpan={4} className={cn(smallTableCellClass, 'p-0')}>
          <PaymentCategoryCombobox
            options={props.options}
            onSelect={(option) => {
              props.onSelect(option);
              setSelectingCategory(false);
            }}
          />
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={4} className={cn(smallTableCellClass, 'p-0')}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-none border-0"
          onClick={() => setSelectingCategory(true)}
        >
          <Plus data-icon="inline-start" />
          Add payment
        </Button>
      </TableCell>
    </TableRow>
  );
}

function PaymentCategoryCombobox(props: { options: CategoryOption[]; onSelect: (option: CategoryOption) => void }) {
  const [inputValue, setInputValue] = useState('');
  const filteredOptions = props.options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <Combobox<CategoryOption>
        value={null}
        autoHighlight
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
          autoFocus
          placeholder="Select category"
          className="w-full rounded-none border-0"
          showClear={inputValue.length > 0}
        />
        <ComboboxContent>
          <ComboboxList>
            {filteredOptions.map((option) => (
              <ComboboxItem key={option.value} value={option}>
                <span className="flex-1">{option.label}</span>
                <span className="text-muted-foreground">{formatCurrency(option.rateAmount)}/hr</span>
              </ComboboxItem>
            ))}
          </ComboboxList>
          {filteredOptions.length === 0 && <ComboboxEmpty>No categories available</ComboboxEmpty>}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

function PayslipsSectionSkeleton() {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="overflow-hidden rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="h-7 w-8 bg-muted/40 px-1" />
              <TableHead className="h-7 bg-muted/40 px-2">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead className="h-7 bg-muted/40 px-2 text-right">
                <Skeleton className="ml-auto h-3 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 2 }, (_, index) => (
              <TableRow key={index} className="hover:bg-transparent">
                <TableCell className="w-8 px-1 py-1.5">
                  <Skeleton className="size-3.5" />
                </TableCell>
                <TableCell className="px-2 py-1.5">
                  <Skeleton className="h-3.5 w-20" />
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right">
                  <Skeleton className="ml-auto h-3.5 w-14" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
