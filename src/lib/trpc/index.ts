import { db } from '@/db';
import {
  payslipCreateMutationSchema,
  payslipLineItemsTable,
  payslipsTable,
  rateCreateMutationSchema,
  ratesTable,
  type SelectUser,
} from '@/db/schema';
import { findSupersededRate, ratePeriodsOverlap } from '@/lib/category-rates';
import { formatCents } from '@/lib/currency';
import { eq } from 'drizzle-orm';
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
  employees: t.router({
    list: authedProcedure.query(async ({ ctx }) => {
      const employees = await ctx.db.query.employees.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return employees.map((employee) => toEmployee(employee));
    }),

    get: authedProcedure.input(v.object({ id: v.number() })).query(async ({ ctx, input }) => {
      const employee = await ctx.db.query.employees.findFirst({
        where: { id: input.id },
      });

      if (!employee) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return toEmployee(employee);
    }),

    payslips: t.router({
      list: authedProcedure.input(v.object({ employeeId: v.number() })).query(async ({ ctx, input }) => {
        const payslips = await ctx.db.query.payslips.findMany({
          where: {
            employeeId: input.employeeId,
          },
          orderBy: {
            paymentDate: 'desc',
          },
          with: payslipWith,
        });

        return payslips.map((payslip) => mapPayslip(payslip));
      }),

      get: authedProcedure.input(v.object({ id: v.number() })).query(async ({ ctx, input }) => {
        const payslip = await ctx.db.query.payslips.findFirst({
          where: { id: input.id },
          with: payslipWith,
        });

        if (!payslip) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        return mapPayslip(payslip);
      }),

      create: authedProcedure.input(payslipCreateMutationSchema).mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async (tx) => {
          const now = new Date();
          const seenCategoryIds = new Set<number>();
          const lineItems = [];

          for (const lineItem of input.lineItems) {
            if (seenCategoryIds.has(lineItem.paymentCategoryId)) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Each payment category can only be added once',
              });
            }
            seenCategoryIds.add(lineItem.paymentCategoryId);

            const rate = await tx.query.rates.findFirst({
              where: {
                id: lineItem.rateId,
              },
            });

            if (
              !rate ||
              rate.employeeId !== input.employeeId ||
              rate.paymentCategoryId !== lineItem.paymentCategoryId
            ) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Selected payment category rate is not valid for this employee',
              });
            }

            lineItems.push({
              rateId: lineItem.rateId,
              units: lineItem.hours.toFixed(2),
              paymentDate: input.paymentDate,
              totalAmountCents: Math.round(rate.amountCents * lineItem.hours),
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
    }),
  }),

  paymentCategories: t.router({
    list: authedProcedure.query(async ({ ctx }) => {
      return ctx.db.query.paymentCategories.findMany({
        orderBy: {
          name: 'asc',
        },
      });
    }),

    forEmployee: authedProcedure.input(v.object({ employeeId: v.number() })).query(async ({ ctx, input }) => {
      const rates = await ctx.db.query.rates.findMany({
        where: {
          employeeId: input.employeeId,
        },
        orderBy: {
          effectiveFrom: 'desc',
        },
        with: {
          paymentCategory: true,
        },
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

    rates: t.router({
      history: authedProcedure
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

      create: authedProcedure.input(rateCreateMutationSchema).mutation(async ({ ctx, input }) => {
        return ctx.db.transaction(async (tx) => {
          const categoryRates = await tx.query.rates.findMany({
            where: {
              employeeId: input.employeeId,
              paymentCategoryId: input.paymentCategoryId,
            },
          });

          const hasTimelineConflict = categoryRates.some((rate) =>
            ratePeriodsOverlap(rate.effectiveFrom, rate.effectiveTo, input.effectiveFrom, input.effectiveTo),
          );

          if (hasTimelineConflict && !findSupersededRate(categoryRates, input.effectiveFrom, input.effectiveTo)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'New rate overlaps an existing rate timeline',
            });
          }

          const existingRate = findSupersededRate(categoryRates, input.effectiveFrom, input.effectiveTo);

          let previousRateId = input.previousRateId;
          if (existingRate) {
            await tx
              .update(ratesTable)
              .set({ effectiveTo: input.effectiveFrom })
              .where(eq(ratesTable.id, existingRate.id));

            if (previousRateId !== existingRate.id) {
              previousRateId = existingRate.id;
            }
          }

          const [rate] = await tx
            .insert(ratesTable)
            .values({
              employeeId: input.employeeId,
              paymentCategoryId: input.paymentCategoryId,
              amountCents: Math.round(input.amount * 100),
              effectiveFrom: input.effectiveFrom,
              createdAt: new Date(),
              previousRateId,
              effectiveTo: input.effectiveTo,
            })
            .returning();

          return { id: rate.id };
        });
      }),
    }),
  }),
});

const payslipWith = {
  lineItems: {
    with: {
      rate: {
        with: {
          paymentCategory: true,
        },
      },
    },
  },
} as const;

function toEmployee(employee: { id: number; name: string; birthday: Date }) {
  return {
    ...employee,
    age: getAge(employee.birthday),
  };
}

function mapPayslip<
  TPayslip extends {
    lineItems: Array<{
      units: string;
      rate: {
        amountCents: number;
        paymentCategory: { id: number; name: string } | null;
      } | null;
    }>;
  },
>(payslip: TPayslip) {
  return {
    ...payslip,
    lineItems: payslip.lineItems.map((lineItem) => ({
      ...lineItem,
      totalAmount: formatCents(lineItem.rate!.amountCents * Number(lineItem.units)),
      rate: {
        ...lineItem.rate!,
        amount: formatCents(lineItem.rate!.amountCents),
        paymentCategory: lineItem.rate!.paymentCategory!,
      },
    })),
  } as Omit<TPayslip, 'lineItems'> & {
    lineItems: Array<
      TPayslip['lineItems'][number] & {
        totalAmount: number;
        rate: NonNullable<TPayslip['lineItems'][number]['rate']> & {
          amount: number;
          paymentCategory: NonNullable<NonNullable<TPayslip['lineItems'][number]['rate']>['paymentCategory']>;
        };
      }
    >;
  };
}

function getAge(birthday: Date) {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (today < birthdayThisYear) age -= 1;
  return age;
}
