import { CalendarDays } from 'lucide-react';
import { formatMonthInputValue, parseMonthInputValue } from '@/lib/view-as-of-date';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './ui/input-group';

export function MonthPicker(props: {
  value: Date;
  onChange: (month: Date) => void;
  'aria-label': string;
  className?: string;
}) {
  return (
    <InputGroup className={props.className ?? 'h-7 w-auto bg-background/80'}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <CalendarDays className="size-3.5" />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="month"
        aria-label={props['aria-label']}
        className="w-[9.5rem]"
        value={formatMonthInputValue(props.value)}
        onChange={(event) => props.onChange(parseMonthInputValue(event.target.value))}
      />
    </InputGroup>
  );
}
