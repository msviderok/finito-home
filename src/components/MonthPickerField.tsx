import { format, startOfMonth } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { MonthPicker } from '@/components/ui/monthpicker';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function MonthPickerField(props: {
  value: Date;
  onChange: (month: Date) => void;
  'aria-label': string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <InputGroup className={props.className ?? 'h-7 w-auto bg-background/80'}>
        <InputGroupAddon align="inline-start">
          <InputGroupText>
            <CalendarDays className="size-3.5" />
          </InputGroupText>
        </InputGroupAddon>
        <PopoverTrigger
          nativeButton={false}
          render={
            <InputGroupButton
              variant="ghost"
              className="w-[9.5rem] justify-start px-2 font-normal"
              aria-label={props['aria-label']}
            />
          }
        >
          {format(props.value, 'MMM yyyy')}
        </PopoverTrigger>
      </InputGroup>
      <PopoverContent className="w-auto" align="start">
        <MonthPicker
          className="p-0"
          selectedMonth={props.value}
          onMonthSelect={(date) => {
            props.onChange(startOfMonth(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
