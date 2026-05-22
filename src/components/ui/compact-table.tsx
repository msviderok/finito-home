import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SmallTable(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-md border bg-card shadow-sm', props.className)}>{props.children}</div>
  );
}

export const smallTableHeadClass = 'h-7 bg-muted/40 px-2 text-xs font-medium text-muted-foreground';
export const smallTableCellClass = 'px-2 py-1.5';
export const smallTableRowClass = 'hover:bg-muted/30';
