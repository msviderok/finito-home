import { payslipCreateMutationSchema, payslipLineItemsTable, payslipsTable } from '@/db/schema';
import { findCurrentRateForCategory } from '@/lib/category-rates';
import { TRPCError, type TRPCRouterRecord } from '@trpc/server';
import * as v from 'valibot';
import { protectedProcedure } from '../trpc';

export const employees = {
  list: protectedProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.query.employees.findMany({ orderBy: { name: 'asc' } });
    return employees;
  }),

  get: protectedProcedure.input(v.object({ id: v.number() })).query(async ({ ctx, input }) => {
    const employee = await ctx.db.query.employees.findFirst({
      where: { id: input.id },
    });

    if (!employee) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return employee;
  }),

  payslips: {
    list: protectedProcedure.input(v.object({ employeeId: v.number() })).query(async ({ ctx, input }) => {
      const payslips = await ctx.db.query.payslips.findMany({
        where: {
          employeeId: input.employeeId,
        },
        orderBy: {
          paymentDate: 'desc',
        },
        with: {
          lineItems: {
            with: {
              paymentCategory: true,
            },
          },
        },
      });

      return payslips;
    }),

    get: protectedProcedure.input(v.object({ id: v.number() })).query(async ({ ctx, input }) => {
      const payslip = await ctx.db.query.payslips.findFirst({
        where: { id: input.id },
        with: {
          lineItems: {
            with: {
              paymentCategory: true,
            },
          },
        },
      });

      if (!payslip) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return payslip;
    }),

    create: protectedProcedure.input(payslipCreateMutationSchema).mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const now = new Date();
        const seenCategoryIds = new Set<number>();
        const employeeRates = await tx.query.rates.findMany({
          where: { employeeId: input.employeeId },
        });
        const lineItems = [];

        for (const lineItem of input.lineItems) {
          seenCategoryIds.add(lineItem.paymentCategoryId);

          const rate = findCurrentRateForCategory(employeeRates, lineItem.paymentCategoryId, input.paymentDate);

          if (!rate) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Selected payment category rate is not valid for this employee',
            });
          }

          lineItems.push({
            paymentCategoryId: lineItem.paymentCategoryId,
            units: lineItem.hours.toFixed(2),
            paymentDate: input.paymentDate,
            createAtAmountCents: Math.round(rate.amountCents * lineItem.hours),
            createdAt: now,
            createdById: ctx.user.id,
          });
        }

        const [payslip] = await tx
          .insert(payslipsTable)
          .values({
            employeeId: input.employeeId,
            paymentDate: input.paymentDate,
            createdAt: now,
            createdById: ctx.user.id,
          })
          .returning();

        await tx.insert(payslipLineItemsTable).values(
          lineItems.map((lineItem) => ({
            ...lineItem,
            payslipId: payslip.id,
          })),
        );

        return { id: payslip.id };
      });
    }),
  },
} satisfies TRPCRouterRecord;
