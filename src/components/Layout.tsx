import { TooltipProvider } from '@/components/ui/tooltip';

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="container mx-auto p-4">{props.children}</div>
    </TooltipProvider>
  );
}
