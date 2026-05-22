import { createContext, useContext, useState, type ReactNode } from 'react';
import { currentViewAsOfMonth, isViewingCurrentMonth, parseMonthInputValue, viewAsOfInstant } from '@/lib/date';

type ViewAsOfContextValue = {
  viewAsOfMonth: Date;
  viewAsOfAt: Date;
  isRetroactiveView: boolean;
  setViewAsOfMonth: (month: Date) => void;
  setViewAsOfMonthFromInput: (value: string) => void;
};

const ViewAsOfContext = createContext<ViewAsOfContextValue | null>(null);

export function ViewAsOfProvider(props: { children: ReactNode; initialViewAsOfMonth?: Date }) {
  const [viewAsOfMonth, setViewAsOfMonth] = useState(() => props.initialViewAsOfMonth ?? currentViewAsOfMonth());
  const viewAsOfAt = viewAsOfInstant(viewAsOfMonth);
  const isRetroactiveView = !isViewingCurrentMonth(viewAsOfMonth);

  const value = {
    viewAsOfMonth,
    viewAsOfAt,
    isRetroactiveView,
    setViewAsOfMonth,
    setViewAsOfMonthFromInput: (monthValue: string) => setViewAsOfMonth(parseMonthInputValue(monthValue)),
  };

  return <ViewAsOfContext.Provider value={value}>{props.children}</ViewAsOfContext.Provider>;
}

export function useViewAsOf() {
  const context = useContext(ViewAsOfContext);
  if (!context) {
    throw new Error('useViewAsOf must be used within ViewAsOfProvider');
  }
  return context;
}
