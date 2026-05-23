import type { AppRouter } from '@/lib/trpc';
import { TRPCClientError, createTRPCClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { toast } from 'sonner';
import superjson from 'superjson';

export type { AppRouter } from './index';
export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: '/api/trpc',
    }),
  ],
});

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

export function notifyTRPCError(error: unknown) {
  if (typeof window === 'undefined' || !isTRPCClientError(error)) return;

  toast.error('Request failed', {
    description: error.message,
  });
}

function isTRPCClientError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}
