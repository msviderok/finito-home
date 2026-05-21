import { initTRPC } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { db } from '@/db';

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  return { db };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export type AppRouter = typeof appRouter;
export const appRouter = t.router({
  listEmployees: t.procedure.query(async ({ ctx }) => {
    const employees = await ctx.db.query.employees.findMany({
      orderBy: {
        name: 'asc',
      },
      with: {
        categoryRates: {
          with: {
            paymentCategory: true,
          },
        },
      },
    });
    return employees.map((employee) => ({
      ...employee,
      categoryRates: employee.categoryRates.map((categoryRate) => ({
        ...categoryRate,
        paymentCategory: categoryRate.paymentCategory!,
        amount: categoryRate.amountCents / 100,
      })),
    }));
  }),
});
