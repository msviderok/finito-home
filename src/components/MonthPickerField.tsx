import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { MonthPicker } from '@/components/ui/monthpicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type ButtonSize = NonNullable<ComponentProps<typeof Button>['size']>;

type ButtonVariant = NonNullable<ComponentProps<typeof Button>['variant']>;

export function MonthPickerField(props: {
  value: Date;
  onChange: (value: string) => void;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  label?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant={props.variant ?? 'outline'}
            {...(props.size ? { size: props.size } : {})}
            aria-label={props['aria-label']}
            className={cn('flex items-center gap-2 text-xs', props.className)}
          />
        }
      >
        <CalendarDays className="size-3.5" />
        {props.label ?? format(props.value, 'MMM yyyy')}
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <MonthPicker
          className="p-0"
          selectedMonth={props.value}
          onMonthSelect={(date) => {
            const newDate = format(date, 'MM-yyyy');
            props.onChange(newDate);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
