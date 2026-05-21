# Migrations (Drizzle Kit 1.0 beta)

For ORM relations and queries see [SKILL.md](../SKILL.md).

## Layout (snapshot v7)

```
src/db/migrations/
  20260521100034_clumsy_deathstrike/
    migration.sql      # SQL + --> statement-breakpoint
    snapshot.json      # version "7", dialect, ddl[], prevIds[]
```

Kit diffs current `schema` folder against latest snapshot; emits next folder.

## Commands

| Command                | Purpose                           |
| ---------------------- | --------------------------------- |
| `drizzle-kit generate` | Schema → new migration folder     |
| `drizzle-kit migrate`  | Apply pending SQL to DB in config |
| `drizzle-kit check`    | Schema vs snapshots (drift)       |
| `drizzle-kit push`     | Direct DDL sync (dev only)        |
| `drizzle-kit pull`     | DB → schema introspection         |
| `drizzle-kit studio`   | GUI                               |
| `drizzle-kit export`   | Diff export formats               |

Flags: `--config`, `--name`, `--custom` (empty migration for hand SQL), `--breakpoints`.

## Config (Turso / this repo)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

## Workflow

1. Change TypeScript schema.
2. `pnpm db generate` — review `migration.sql`.
3. `pnpm db migrate` locally → staging → prod.
4. `pnpm db check` in CI.

**Do not** rewrite old migration folders after deploy.

## Hand-edited SQL

Use when Kit cannot express: partial indexes, data backfills, complex CHECK.

1. `pnpm db generate --custom --name backfill_x` or edit generated SQL before migrate.
2. Keep `src/db/schema` aligned with resulting DB shape.

## Common SQL patterns (SQLite)

```sql
ALTER TABLE users ADD COLUMN phone text;
CREATE INDEX idx_users_phone ON users(phone);

-- Data before NOT NULL
UPDATE users SET status = 'active' WHERE status IS NULL;
-- then ALTER in same or follow-up migration
```

TypeScript mirror — column SQL name exact:

```typescript
phone: text('phone'),
```

## Junction / composite PK (beta)

```typescript
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core';

export const usersToGroupsTable = sqliteTable(
  'users_to_groups',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => usersTable.id),
    groupId: integer('group_id')
      .notNull()
      .references(() => groupsTable.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
);
```

## Troubleshooting

| Issue                 | Action                                             |
| --------------------- | -------------------------------------------------- |
| Drift on `check`      | Regenerate or fix schema; commit snapshots         |
| Rename ambiguity      | Kit prompts; choose explicit rename vs drop/create |
| Migrate fails on data | Backfill in prior migration; then constraint       |
| Baseline existing DB  | `drizzle-kit push --init` then normal generate     |

## CI example

```yaml
- run: pnpm db check
```

Optional staging: `pnpm db migrate` with secrets URL.

## Optional SQL-first teams

Write `migration.sql` first, then mirror in `sqliteTable` definitions. Default in this repo remains **schema-first** + `generate`.
