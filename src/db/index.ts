import { drizzle } from 'drizzle-orm/libsql';
import { env } from '@/env';
import { schema, relations } from './schema';

export const db = drizzle({
  schema,
  relations,
  connection: {
    url: env.TURSO_CONNECTION_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
});
