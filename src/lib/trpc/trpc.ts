import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

export const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  let user = ctx.user;
  if (!user) {
    try {
      user = (await ctx.db.query.users.findFirst()) ?? null;
    } catch (error) {
      console.error(error);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }
  }

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return next({ ctx: { ...ctx, user } });
});
