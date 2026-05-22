import { rateCreateMutationSchema, ratesTable } from '@/db/schema';
import { formatCents } from '@/lib/currency';
import type { TRPCRouterRecord } from '@trpc/server';
import * as v from 'valibot';
import { protectedProcedure } from '../trpc';

export const rates = {
  history: protectedProcedure
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
        orderBy: { effectiveFrom: 'desc' },
        with: { paymentCategory: true },
      });

      return rates.map((entry) => ({
        ...entry,
        paymentCategory: entry.paymentCategory!,
        amount: formatCents(entry.amountCents),
      }));
    }),

  create: protectedProcedure.input(rateCreateMutationSchema).mutation(async ({ ctx, input }) => {
    const [rate] = await ctx.db
      .insert(ratesTable)
      .values({
        employeeId: input.employeeId,
        paymentCategoryId: input.paymentCategoryId,
        amountCents: Math.round(input.amount * 100),
        effectiveFrom: input.effectiveFrom,
        createdAt: new Date(),
      })
      .returning();

    return { id: rate.id };
  }),
} satisfies TRPCRouterRecord;
