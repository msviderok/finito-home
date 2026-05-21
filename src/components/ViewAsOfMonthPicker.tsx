import { useViewAsOf } from '@/contexts/ViewAsOfProvider';
import { MonthPicker } from './MonthPicker';

export function ViewAsOfMonthPicker() {
  const { viewAsOfMonth, setViewAsOfMonth } = useViewAsOf();

  return (
    <MonthPicker
      aria-label="View data as of month"
      className="h-7 w-auto bg-background/80 backdrop-blur"
      value={viewAsOfMonth}
      onChange={setViewAsOfMonth}
    />
  );
}
