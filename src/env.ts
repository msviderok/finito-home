import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-core/presets-valibot';
import * as v from 'valibot';

export const env = createEnv({
  server: {
    TURSO_CONNECTION_URL: v.pipe(v.string(), v.url()),
    TURSO_AUTH_TOKEN: v.string(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',
  client: {},

  /**
   * Shared environment variables that are available on both the server and the client.
   */
  shared: {
    PORT: v.optional(v.number(), 3000),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: process.env,

  /**
   * By default, this library will feed the environment variables directly to
   * the Valibot validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Valibot will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,

  extends: [vercel()],
});
