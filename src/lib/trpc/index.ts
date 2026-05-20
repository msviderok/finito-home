import { initTRPC } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import * as v from 'valibot';

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

  trigger: t.procedure
    .input(
      v.object({
        date: v.date(),
      }),
    )
    .mutation(async ({ input }) => {
      console.log('Got input', input);
      return input.date.toISOString();
    }),
});
