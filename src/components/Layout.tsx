import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from './ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <ThemeToggle />
        <div className="container mx-auto p-4">{props.children}</div>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
