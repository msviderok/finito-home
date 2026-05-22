import { format, startOfMonth } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { MonthPicker } from '@/components/ui/monthpicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function MonthPickerField(props: { value: Date; onChange: (month: Date) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" className="flex items-center gap-2 text-xs" />}>
        <CalendarDays className="size-3.5" />
        {format(props.value, 'MMM yyyy')}
      </PopoverTrigger>
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
