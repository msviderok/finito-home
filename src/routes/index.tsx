import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { createCaller } from '@/trpc/router';

export const Route = createFileRoute('/')({
  loader: async () => {
    const caller = createCaller({});
    return caller.hello({ name: 'TanStack Start' });
  },
  component: App,
});

function App() {
  const { greeting } = Route.useLoaderData();

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <p className="text-muted-foreground">{greeting}</p>
          <Button className="mt-2">Button</Button>
        </div>
      </div>
    </div>
  );
}
