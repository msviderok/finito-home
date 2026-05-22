import { db } from '@/db';
import { type SelectUser } from '@/db/schema';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
export function createTRPCContext(_opts: FetchCreateContextFnOptions) {
  return { db, user: null as SelectUser | null };
}
