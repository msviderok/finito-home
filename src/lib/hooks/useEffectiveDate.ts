import { format, parse, startOfMonth } from 'date-fns';
import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const LS_KEY = 'effective-date';
const CURRENT_DATE = startOfMonth(new Date());

function fmt(date: Date) {
  return format(date, 'MM-yyyy');
}

type EffectiveDateContextValue = {
  effectiveDate: Date;
  isRetroactiveView: boolean;
  setEffectiveDate: (date: string) => void;
};

const EffectiveDateContext = createContext<EffectiveDateContextValue | null>(null);

export function EffectiveDateProvider(props: { children: ReactNode; initialInput?: string }) {
  const [effectiveDateInput, setEffectiveDateInput] = useState(props.initialInput ?? fmt(CURRENT_DATE));
  const effectiveDate = useMemo(() => parse(effectiveDateInput, 'MM-yyyy', new Date(2000, 0, 1)), [effectiveDateInput]);
  const isRetroactiveView =
    effectiveDate.getMonth() !== CURRENT_DATE.getMonth() || effectiveDate.getFullYear() !== CURRENT_DATE.getFullYear();

  useEffect(() => {
    if (props.initialInput != null) return;
    const storedValue = window.localStorage.getItem(LS_KEY);
    if (storedValue == null) return;
    setEffectiveDateInput(storedValue);
  }, [props.initialInput]);

  return createElement(
    EffectiveDateContext.Provider,
    {
      value: {
        effectiveDate,
        isRetroactiveView,
        setEffectiveDate: (date: string) => {
          setEffectiveDateInput(date);
          window.localStorage.setItem(LS_KEY, date);
        },
      },
    },
    props.children,
  );
}

export function useEffectiveDate() {
  const value = useContext(EffectiveDateContext);
  if (value == null) throw new Error('useEffectiveDate must be used within EffectiveDateProvider');
  return value;
}
