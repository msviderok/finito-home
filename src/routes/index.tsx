import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const { mutate: trigger, data } = useMutation(trpc.trigger.mutationOptions());
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className="mt-2" onClick={() => trigger({ date: new Date() })}>
            Trigger TRPC endpoint
          </Button>
          <span>Last response: {data}</span>
        </div>
      </div>
    </div>
  );
}
