import { env } from '@/env';
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
      url: getUrl(),
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

function getUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/trpc`;
  }

  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_BRANCH_URL ?? env.VERCEL_URL;
  if (vercelHost) {
    return `${vercelHost.startsWith('http') ? vercelHost : `https://${vercelHost}`}/api/trpc`;
  }

  return `http://localhost:${env.PORT ?? 3000}/api/trpc`;
}

function isTRPCClientError(error: unknown): error is TRPCClientError<AppRouter> {
  return error instanceof TRPCClientError;
}
