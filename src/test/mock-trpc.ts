import { vi } from 'vitest';
import { categoryRatesByEmployee } from './mock-trpc-store';

export const dismissRateMutation = vi.fn();

const trpc = {
  rates: {
    dismiss: {
      mutationOptions: () => ({
        mutationFn: dismissRateMutation,
      }),
    },
  },
  paymentCategories: {
    forEmployee: {
      queryOptions: ({ employeeId }: { employeeId: number }) => {
        const rates = categoryRatesByEmployee.get(employeeId) ?? [];
        return {
          queryKey: ['paymentCategories', 'forEmployee', employeeId] as const,
          queryFn: () => rates,
          initialData: rates,
          staleTime: Number.POSITIVE_INFINITY,
        };
      },
    },
  },
  employees: {
    payslips: {
      list: {
        queryOptions: ({ employeeId }: { employeeId: number }) => ({
          queryKey: ['payslips', 'list', employeeId] as const,
          queryFn: () => [],
        }),
      },
      get: {
        queryOptions: ({ id }: { id: number }) => ({
          queryKey: ['payslips', 'get', id] as const,
          queryFn: () => null,
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
