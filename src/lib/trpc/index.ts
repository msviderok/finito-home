import { db } from '@/db';
import { rateCreateMutationSchema, ratesTable, type SelectUser } from '@/db/schema';
import { formatCents } from '@/lib/currency';
import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import * as v from 'valibot';

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  return { db, user: null as SelectUser | null };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  let user = ctx.user;
  if (!user) {
    user = (await ctx.db.query.users.findFirst()) ?? null;
  }

  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return next({ ctx: { ...ctx, user } });
});

export type AppRouter = typeof appRouter;
export const appRouter = t.router({
  listEmployees: authedProcedure.query(async ({ ctx }) => {
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
        amount: formatCents(categoryRate.amountCents),
      })),
    }));
  }),

  getRateHistory: authedProcedure
    .input(
      v.object({
        employeeId: v.number(),
        paymentCategoryId: v.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rates = await ctx.db.query.rates.findMany({
        where: {
          employeeId: input.employeeId,
          paymentCategoryId: input.paymentCategoryId,
        },
        orderBy: {
          effectiveFrom: 'desc',
        },
        with: {
          paymentCategory: true,
        },
      });

      return rates.map((entry) => ({
        ...entry,
        paymentCategory: entry.paymentCategory!,
        amount: formatCents(entry.amountCents),
      }));
    }),

  createRate: authedProcedure.input(rateCreateMutationSchema).mutation(async ({ ctx, input }) => {
    const data = await ctx.db.insert(ratesTable).values({
      employeeId: input.employeeId,
      paymentCategoryId: input.paymentCategoryId,
      amountCents: Math.round(input.amount * 100),
      effectiveFrom: input.effectiveFrom,
      createdAt: new Date(),
      previousRateId: input.previousRateId,
      effectiveTo: input.effectiveTo,
    });
    console.log(data);
  }),
});
