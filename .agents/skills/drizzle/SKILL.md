---
name: drizzle
description: Drizzle ORM and Drizzle Kit 1.0 beta (defineRelations, RQB v2, v7 migrations, Turso/libsql). Use for schema changes, defineRelations, db.query relational API, drizzle-valibot, generate/migrate/check, or avoiding deprecated v0.x/v1 relations patterns.
---

# Drizzle ORM & Kit (1.0 beta)

Target: **`drizzle-orm@1.0.0-beta.22`** + **`drizzle-kit@1.0.0-beta.22`** (this repo’s catalog pin). Docs: [orm.drizzle.team](https://orm.drizzle.team), [relations v1→v2](https://orm.drizzle.team/docs/relations-v1-v2), [RQB v2](https://orm.drizzle.team/docs/rqb-v2).

## Beta vs legacy (do not mix)

| Area                 | Legacy (outdated in skill refs)                                        | Beta (use this)                                              |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Relations            | Per-table `relations()` from `drizzle-orm` or `drizzle-orm/_relations` | `defineRelations(schema, …)` from `drizzle-orm`              |
| RQB `where`          | Callback `where: (users, { eq }) => eq(...)`                           | Object `where: { id: 1 }`, `AND`/`OR`/`RAW`                  |
| RQB `orderBy`        | `orderBy: (t, { desc }) => desc(t.id)`                                 | `orderBy: { name: 'asc' }` or nested objects                 |
| DB client            | `drizzle(url, { schema })` only                                        | `drizzle({ schema, relations, connection })`                 |
| `sqliteTable` extras | Object `(t) => ({ idx: index(...) })`                                  | **Array** `(t) => [uniqueIndex(...)]`                        |
| `primaryKey`         | `primaryKey(col1, col2)`                                               | `primaryKey({ columns: [col1, col2] })`                      |
| Migrations           | Flat `drizzle/0000_x.sql` + meta journal                               | Folder per migration: `migration.sql` + `snapshot.json` (v7) |
| Kit dialect          | `driver: 'pg'` in old configs                                          | `dialect: 'turso'` \| `'sqlite'` \| `'postgresql'` …         |

Staying on RQB v1 temporarily: import `relations` from `drizzle-orm/_relations` only — do not document v1 as default.

## This project

| Item      | Value                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Config    | `drizzle.config.ts` — `defineConfig`, `dialect: 'turso'`, `schema: './src/db/schema'`, `out: './src/db/migrations'` |
| Client    | `src/db/index.ts` — `drizzle-orm/libsql`, pass **`schema` + `relations`**                                           |
| Tables    | `src/db/schema/*.ts` — `sqliteTable`, exported as `schema` map in `index.ts`                                        |
| Relations | `src/db/schema/relations.ts` — `defineRelations`                                                                    |
| Valibot   | `drizzle-valibot` — `createSelectSchema` / `createInsertSchema` / `createUpdateSchema`                              |
| CLI       | `pnpm db` → `drizzle-kit`                                                                                           |

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { schema, relations } from './schema';

export const db = drizzle({
  schema,
  relations,
  connection: { url: env.TURSO_CONNECTION_URL, authToken: env.TURSO_AUTH_TOKEN },
});
```

Schema map keys **must match** `defineRelations` keys and `db.query.*` accessors (`employees`, not `employeesTable`).

## Schema (SQLite / Turso)

```typescript
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (t) => [
  uniqueIndex('users_email_unique').on(t.email),
]);

// Self-FK
previousRateId: integer('previous_rate_id').references((): AnySQLiteColumn => ratesTable.id),

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
```

| Column                                   | Notes                        |
| ---------------------------------------- | ---------------------------- |
| `integer('id').primaryKey()`             | SQLite rowid / autoincrement |
| `integer(..., { mode: 'timestamp_ms' })` | `Date` in TS                 |
| `numeric()`                              | Decimal as **string**        |
| `text('role', { enum: ['a', 'b'] })`     | SQLite enum pattern          |

FKs: `.references(() => otherTable.id)` on column builders (DB-level FK; relations are separate).

## Relations v2 (`defineRelations`)

One file; keys = schema map keys; relation names = `with` keys in queries.

```typescript
import { defineRelations } from 'drizzle-orm';

export const relations = defineRelations(
  {
    employees: employeesTable,
    rates: ratesTable,
    payslips: payslipsTable,
  },
  (r) => ({
    employees: {
      categoryRates: r.many.rates({
        from: r.employees.id,
        to: r.rates.employeeId,
      }),
      payslips: r.many.payslips({
        from: r.employees.id,
        to: r.payslips.employeeId,
      }),
    },
    rates: {
      employee: r.one.employees({
        from: r.rates.employeeId,
        to: r.employees.id,
      }),
      previousRate: r.one.rates({
        from: r.rates.previousRateId,
        to: r.rates.id,
      }),
    },
  }),
);
```

- **`r.one.<table>({ from, to })`** — explicit FK ends (required when ambiguous).
- **`r.many.<table>()`** — shorthand when Drizzle infers FK from schema.
- **Many-to-many** — `r.many.groups({ from: r.users.id.through(r.usersToGroups.userId), to: r.groups.id.through(r.usersToGroups.groupId) })`; query with `with: { groups: true }` (no junction in `with`).

More: [references/relations-v2.md](references/relations-v2.md).

## Relational queries (RQB v2)

```typescript
await db.query.employees.findMany({
  where: { id: { gt: 0 } },
  orderBy: { name: 'asc' },
  with: {
    categoryRates: {
      with: { paymentCategory: true },
    },
  },
});
```

- Table accessor = schema key (`employees`, `rates`).
- Nested `where` on relations filters parents (see RQB v2 docs).
- Operators on columns: `eq`, `gt`, `in`, `like`, `isNull`, `AND`, `OR`, `NOT`, `RAW: (table) => sql\`...\``.

SQL builder (unchanged): `db.select().from(usersTable).where(eq(...))` — use `drizzle-orm` operators (`eq`, `and`, `sql`).

More: [references/rqb-v2.md](references/rqb-v2.md).

## Migrations (Kit + snapshot v7)

**Schema-first** (default):

1. Edit `src/db/schema/*.ts` (+ `relations.ts` if graph changes).
2. `pnpm db generate` → `src/db/migrations/<timestamp>_<slug>/migration.sql` + `snapshot.json`.
3. Review SQL (`--> statement-breakpoint` between statements).
4. `pnpm db migrate` on each environment.
5. Commit schema + migration folder; CI: `pnpm db check`.

Snapshot shape: `"version": "7"`, `"dialect": "sqlite"`, `ddl` array, `prevIds` chain.

```bash
pnpm db generate [--name my_change]
pnpm db migrate
pnpm db check
pnpm db studio
pnpm db push          # dev prototype only — not prod
pnpm db pull          # introspect DB → schema
pnpm db up            # upgrade kit metadata (rare)
pnpm db export        # SQL diff export
```

`push --init` — baseline existing DB before diffing (beta).

Never edit applied migration folders; add a new migration.

More: [references/migrations.md](references/migrations.md).

### drizzle-valibot

```typescript
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-valibot';

export const rateInsertSchema = createInsertSchema(ratesTable);
```

## Red flags

- Using v1 `relations()` + v2 `defineRelations` together without `_relations` import path
- `db.query.employeesTable` — wrong key; use schema map key
- `sqliteTable` third arg as **object** (deprecated; use array)
- `primaryKey(a, b)` variadic (deprecated)
- Editing shipped `migration.sql` / `snapshot.json`
- `push` in production
- Raw SQL string concat (use `sql` template)

## Legacy reference files

[advanced-schemas.md](references/advanced-schemas.md), [query-patterns.md](references/query-patterns.md), [performance.md](references/performance.md), [vs-prisma.md](references/vs-prisma.md) are **pre–1.0-beta**, PostgreSQL-centric snippets. Prefer this SKILL + [relations-v2.md](references/relations-v2.md) + [rqb-v2.md](references/rqb-v2.md) + official docs.
