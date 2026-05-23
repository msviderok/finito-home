'use client';
import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

type Month = {
  number: number;
  name: string;
};

const monthPickerVariants = cva('flex w-64 min-w-52 flex-col gap-3 rounded-md bg-popover p-3 text-popover-foreground');

const monthPickerHeaderVariants = cva('relative flex h-7 items-center justify-center');

const monthPickerYearVariants = cva('text-xs/relaxed font-medium text-foreground');

const monthPickerGridVariants = cva('grid grid-cols-4 gap-1');

const monthPickerButtonVariants = cva(
  'ease inline-flex shrink-0 items-center justify-center rounded-md border bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-input/30',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        icon: "size-7 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        month: 'h-8 w-full px-2 font-normal',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'month',
    },
  },
);

const MONTHS: Month[][] = [
  [
    { number: 0, name: 'Jan' },
    { number: 1, name: 'Feb' },
    { number: 2, name: 'Mar' },
    { number: 3, name: 'Apr' },
  ],
  [
    { number: 4, name: 'May' },
    { number: 5, name: 'Jun' },
    { number: 6, name: 'Jul' },
    { number: 7, name: 'Aug' },
  ],
  [
    { number: 8, name: 'Sep' },
    { number: 9, name: 'Oct' },
    { number: 10, name: 'Nov' },
    { number: 11, name: 'Dec' },
  ],
];

type MonthCalProps = {
  selectedMonth?: Date;
  onMonthSelect?: (date: Date) => void;
  onYearForward?: () => void;
  onYearBackward?: () => void;
  callbacks?: {
    yearLabel?: (year: number) => string;
    monthLabel?: (month: Month) => string;
  };
  variant?: {
    calendar?: {
      main?: ButtonVariant;
      selected?: ButtonVariant;
    };
    chevrons?: ButtonVariant;
  };
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
};

type ButtonVariant = VariantProps<typeof monthPickerButtonVariants>['variant'];

function MonthPicker({
  onMonthSelect,
  selectedMonth,
  minDate,
  maxDate,
  disabledDates,
  callbacks,
  onYearBackward,
  onYearForward,
  variant,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & MonthCalProps) {
  return (
    <div data-slot="month-picker" className={cn(monthPickerVariants(), className)} {...props}>
      <MonthCal
        onMonthSelect={onMonthSelect}
        callbacks={callbacks}
        selectedMonth={selectedMonth}
        onYearBackward={onYearBackward}
        onYearForward={onYearForward}
        variant={variant}
        minDate={minDate}
        maxDate={maxDate}
        disabledDates={disabledDates}
      />
    </div>
  );
}

function MonthCal({
  selectedMonth,
  onMonthSelect,
  callbacks,
  variant,
  minDate,
  maxDate,
  disabledDates,
  onYearBackward,
  onYearForward,
}: MonthCalProps) {
  const selectedYear = selectedMonth?.getFullYear();
  const selectedMonthNumber = selectedMonth?.getMonth();
  const [menuYear, setMenuYear] = React.useState<number>(selectedYear ?? new Date().getFullYear());

  React.useEffect(() => {
    if (selectedYear !== undefined) {
      setMenuYear(selectedYear);
    }
  }, [selectedYear]);

  if (minDate && maxDate && minDate > maxDate) minDate = maxDate;

  const disabledDatesMapped = disabledDates?.map((d) => {
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <>
      <div data-slot="month-picker-header" className={monthPickerHeaderVariants()}>
        <button
          type="button"
          aria-label="Previous year"
          onClick={() => {
            setMenuYear(menuYear - 1);
            onYearBackward?.();
          }}
          className={cn(
            monthPickerButtonVariants({ variant: variant?.chevrons ?? 'outline', size: 'icon' }),
            'absolute left-0',
          )}
        >
          <ChevronLeft data-icon="inline-start" />
        </button>
        <div data-slot="month-picker-year" className={monthPickerYearVariants()}>
          {callbacks?.yearLabel ? callbacks?.yearLabel(menuYear) : menuYear}
        </div>
        <button
          type="button"
          aria-label="Next year"
          onClick={() => {
            setMenuYear(menuYear + 1);
            onYearForward?.();
          }}
          className={cn(
            monthPickerButtonVariants({ variant: variant?.chevrons ?? 'outline', size: 'icon' }),
            'absolute right-0',
          )}
        >
          <ChevronRight data-icon="inline-end" />
        </button>
      </div>
      <div data-slot="month-picker-grid" className={monthPickerGridVariants()}>
        {MONTHS.flat().map((m) => {
          const selected = selectedMonthNumber === m.number && selectedYear === menuYear;
          const disabled =
            (maxDate
              ? menuYear > maxDate.getFullYear() ||
                (menuYear === maxDate.getFullYear() && m.number > maxDate.getMonth())
              : false) ||
            (minDate
              ? menuYear < minDate.getFullYear() ||
                (menuYear === minDate.getFullYear() && m.number < minDate.getMonth())
              : false) ||
            (disabledDatesMapped
              ? disabledDatesMapped.some((d) => d.year === menuYear && d.month === m.number)
              : false);

          return (
            <button
              key={m.number}
              type="button"
              aria-selected={selected}
              data-slot="month-picker-month"
              data-selected={selected ? '' : undefined}
              onClick={() => {
                onMonthSelect?.(new Date(menuYear, m.number, 1));
              }}
              disabled={disabled}
              className={monthPickerButtonVariants({
                variant: selected ? (variant?.calendar?.selected ?? 'default') : (variant?.calendar?.main ?? 'ghost'),
                size: 'month',
              })}
            >
              {callbacks?.monthLabel ? callbacks.monthLabel(m) : m.name}
            </button>
          );
        })}
      </div>
    </>
  );
}

MonthPicker.displayName = 'MonthPicker';

export { MonthPicker };
