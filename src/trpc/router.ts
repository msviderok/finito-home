import * as v from 'valibot';
import { createCallerFactory, createTRPCRouter, publicProcedure } from './init';

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(v.object({ name: v.string() }))
    .query(({ input }) => ({ greeting: `Hello, ${input.name}!` })),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
