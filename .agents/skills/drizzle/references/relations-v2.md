# Relations v2 (`defineRelations`)

Drizzle ORM **1.0 beta**. Official: [relations-v1-v2](https://orm.drizzle.team/docs/relations-v1-v2).

## Setup

```typescript
// schema/index.ts — map keys are relation roots
export const schema = {
  users: usersTable,
  posts: postsTable,
};

// relations.ts
import { defineRelations } from 'drizzle-orm';
import { schema } from './index'; // or inline tables

export const relations = defineRelations(schema, (r) => ({
  users: { /* ... */ },
  posts: { /* ... */ },
}));

// db client — both required for db.query
drizzle({ schema, relations, connection: { ... } });
```

## `one`

```typescript
posts: {
  author: r.one.users({
    from: r.posts.authorId,
    to: r.users.id,
    alias: 'author_post', // optional, disambiguate multiple FKs to same table
  }),
},
```

`from` = FK column(s) on source table; `to` = referenced PK column(s).

## `many`

Explicit:

```typescript
employees: {
  rates: r.many.rates({
    from: r.employees.id,
    to: r.rates.employeeId,
  }),
},
```

Inferred (when single FK path exists):

```typescript
users: {
  posts: r.many.posts(),
},
```

## Many-to-many (`through`)

```typescript
users: {
  groups: r.many.groups({
    from: r.users.id.through(r.usersToGroups.userId),
    to: r.groups.id.through(r.usersToGroups.groupId),
  }),
},
groups: {
  participants: r.many.users(),
},
```

Query: `db.query.users.findMany({ with: { groups: true } })` — junction omitted in `with`.

## v1 migration (avoid in new code)

| v1 (`drizzle-orm/_relations`)                                      | v2                                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `relations(users, ({ many }) => ({ posts: many(posts) }))`         | `defineRelations(schema, (r) => ({ users: { posts: r.many.posts() } }))` |
| `one(users, { fields: [posts.authorId], references: [users.id] })` | `r.one.users({ from: r.posts.authorId, to: r.users.id })`                |

FK columns still declared on `sqliteTable` / `pgTable`; relations do not replace `.references()`.

## Naming rules

- Top-level keys = `schema` object keys (`employees`, not `employeesTable`).
- Relation property names = keys in `with: { categoryRates: true }`.
- Target table in builder: `r.one.users`, `r.many.rates` (schema key).
