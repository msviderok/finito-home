import { formatCents } from '@/lib/currency';
import type { TRPCRouterRecord } from '@trpc/server';
import * as v from 'valibot';
import { protectedProcedure } from '../trpc';

export const paymentCategories = {
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.paymentCategories.findMany({ orderBy: { name: 'asc' } });
  }),

  forEmployee: protectedProcedure
    .input(v.object({ employeeId: v.number(), effectiveDate: v.date() }))
    .query(async ({ ctx, input }) => {
      const rates = await ctx.db.query.rates.findMany({
        where: {
          employeeId: input.employeeId,
          effectiveFrom: { lte: input.effectiveDate },
        },
        orderBy: { createdAt: 'desc' },
        with: { paymentCategory: true },
      });

      return rates
        .map((rate) => ({
          ...rate,
          paymentCategory: rate.paymentCategory!,
          amount: formatCents(rate.amountCents),
        }))
        .sort((a, b) => {
          const categoryCompare = a.paymentCategory.name.localeCompare(b.paymentCategory.name);
          if (categoryCompare !== 0) return categoryCompare;
          return b.effectiveFrom.getTime() - a.effectiveFrom.getTime();
        });
    }),
} satisfies TRPCRouterRecord;
