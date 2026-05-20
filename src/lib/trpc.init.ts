import { initTRPC } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  return {};
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export type AppRouter = typeof appRouter;
export const appRouter = t.router({
  hello: t.procedure.query(() => 'Hello world!'),
});
