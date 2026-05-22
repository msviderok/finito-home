import { useViewAsOf } from '@/contexts/ViewAsOfProvider';
import { MonthPickerField } from '@/components/MonthPickerField';

export function ViewAsOfMonthPicker() {
  const { viewAsOfMonth, setViewAsOfMonth } = useViewAsOf();

  return (
    <MonthPickerField
      aria-label="View data as of month"
      className="h-7 w-auto bg-background/80 backdrop-blur"
      value={viewAsOfMonth}
      onChange={setViewAsOfMonth}
    />
  );
}
