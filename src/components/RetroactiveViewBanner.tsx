import { TriangleAlert } from 'lucide-react';
import { useViewAsOf } from '@/contexts/view-as-of';

export function RetroactiveViewBanner() {
  const { isRetroactiveView } = useViewAsOf();

  if (!isRetroactiveView) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-950 dark:text-amber-50"
    >
      <TriangleAlert className="size-3.5 text-amber-600 dark:text-amber-400" />
      <span>You're viewing an old data</span>
    </div>
  );
}
