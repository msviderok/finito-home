import { vi } from 'vitest';
import {
  categoryRatesByEmployee,
  createPayslipInStore,
  createRateInStore,
  dismissRateInStore,
  getPayslipById,
  payslipsByEmployee,
} from './stores';

export const dismissRateMutation = vi.fn((input: { rateId: number }) => {
  dismissRateInStore(input.rateId);
  return { success: true };
});

export const createRateMutation = vi.fn(
  (input: { employeeId: number; paymentCategoryId: number; amount: number; effectiveFrom: Date }) =>
    createRateInStore(input),
);

export const createPayslipMutation = vi.fn(
  (input: {
    employeeId: number;
    paymentDate: Date;
    lineItems: Array<{ paymentCategoryId: number; hours: number }>;
  }) => {
    const payslip = createPayslipInStore(input);
    return { id: payslip.id };
  },
);

const trpc = {
  rates: {
    create: {
      mutationOptions: () => ({
        mutationFn: createRateMutation,
      }),
    },
    dismiss: {
      mutationOptions: () => ({
        mutationFn: dismissRateMutation,
      }),
    },
  },
  paymentCategories: {
    forEmployee: {
      queryOptions: ({ employeeId }: { employeeId: number }) => {
        return {
          queryKey: ['paymentCategories', 'forEmployee', employeeId] as const,
          queryFn: () => categoryRatesByEmployee.get(employeeId) ?? [],
          initialData: () => categoryRatesByEmployee.get(employeeId) ?? [],
          staleTime: Number.POSITIVE_INFINITY,
        };
      },
      queryFilter: () => ({ queryKey: ['paymentCategories', 'forEmployee'] as const }),
    },
  },
  employees: {
    payslips: {
      list: {
        queryOptions: ({ employeeId }: { employeeId: number }) => ({
          queryKey: ['payslips', 'list', employeeId] as const,
          queryFn: () => payslipsByEmployee.get(employeeId) ?? [],
        }),
        queryFilter: () => ({ queryKey: ['payslips', 'list'] as const }),
      },
      get: {
        queryOptions: ({ id }: { id: number }) => ({
          queryKey: ['payslips', 'get', id] as const,
          queryFn: () => getPayslipById(id),
        }),
        queryFilter: () => ({ queryKey: ['payslips', 'get'] as const }),
      },
      create: {
        mutationOptions: () => ({
          mutationFn: createPayslipMutation,
        }),
      },
    },
  },
};

vi.mock('@/router', () => ({
  trpc,
}));

vi.mock('@/lib/trpc/client', () => ({
  useTRPC: () => trpc,
  TRPCProvider: ({ children }: { children: unknown }) => children,
  trpcClient: {},
  notifyTRPCError: vi.fn(),
}));
