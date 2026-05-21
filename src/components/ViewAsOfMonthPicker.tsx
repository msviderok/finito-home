import { CalendarDays } from 'lucide-react';
import { formatMonthInputValue } from '@/lib/view-as-of-date';
import { useViewAsOf } from '@/contexts/view-as-of';
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from './ui/input-group';

export function ViewAsOfMonthPicker() {
  const { viewAsOfMonth, setViewAsOfMonthFromInput } = useViewAsOf();

  return (
    <InputGroup className="h-7 w-auto bg-background/80 backdrop-blur">
      <InputGroupAddon align="inline-start">
        <InputGroupText>
          <CalendarDays className="size-3.5" />
        </InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="month"
        aria-label="View data as of month"
        className="w-[9.5rem]"
        value={formatMonthInputValue(viewAsOfMonth)}
        onChange={(event) => setViewAsOfMonthFromInput(event.target.value)}
      />
    </InputGroup>
  );
}
