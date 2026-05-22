import * as v from 'valibot';

export const appSearchSchema = v.object({
  employee: v.optional(v.number()),
  effectiveDate: v.optional(v.string()),
});
