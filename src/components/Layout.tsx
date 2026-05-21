import { RetroactiveViewBanner } from './RetroactiveViewBanner';
import { ThemeToggle } from './ThemeToggle';
import { ViewAsOfMonthPicker } from './ViewAsOfMonthPicker';
import { ViewAsOfProvider } from '@/contexts/ViewAsOfProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <ViewAsOfProvider>
      <TooltipProvider>
        <div className="fixed top-4 left-4 z-50 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <ViewAsOfMonthPicker />
              <RetroactiveViewBanner />
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-screen-sm p-4 pt-20">{props.children}</div>
        <Toaster />
      </TooltipProvider>
    </ViewAsOfProvider>
  );
}
