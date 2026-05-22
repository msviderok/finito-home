import { currentViewAsOfMonth, formatMonthInputValue, isViewingCurrentMonth, parseMonthInputValue } from '@/lib/date';
import { useNavigate, useSearch } from '@tanstack/react-router';

export function useEffectiveDate() {
  const navigate = useNavigate();
  const { effectiveDate } = useSearch({ strict: false });
  const effectiveDateMonth = effectiveDate == null ? currentViewAsOfMonth() : parseMonthInputValue(effectiveDate);
  const isRetroactiveView = !isViewingCurrentMonth(effectiveDateMonth);

  const setEffectiveDate = (month: Date) => {
    void navigate({
      to: '/',
      search: (prev) => ({
        ...prev,
        effectiveDate: formatMonthInputValue(month),
      }),
      replace: true,
    });
  };

  return {
    effectiveDate: effectiveDateMonth,
    isRetroactiveView,
    setEffectiveDate: setEffectiveDate,
  };
}
