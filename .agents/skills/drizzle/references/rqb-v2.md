# Relational Query Builder v2

Requires `defineRelations` + `db` initialized with `schema` and `relations`. Docs: [rqb-v2](https://orm.drizzle.team/docs/rqb-v2).

## Accessors

Use **schema map keys**:

```typescript
db.query.employees.findMany(...)
db.query.rates.findFirst(...)
```

Not table variable names (`employeesTable`).

## `findMany` / `findFirst`

```typescript
const row = await db.query.employees.findFirst({
  where: { id: 1 },
  with: {
    payslips: { limit: 5, orderBy: { paymentDate: 'desc' } },
    categoryRates: {
      where: { amountCents: { gt: 0 } },
      with: { paymentCategory: true },
    },
  },
});
```

## `where` (object syntax)

```typescript
where: { id: 1 }
where: { id: { gt: 10, in: [1, 2, 3] } }
where: {
  AND: [{ name: { like: 'A%' } }, { id: { gt: 0 } }],
  OR: [{ email: { isNull: true } }, { email: { eq: 'x@y.z' } }],
}
where: { RAW: (table) => sql`lower(${table.name}) = 'ann'` }
```

Filter via relation:

```typescript
where: {
  id: { gt: 10 },
  posts: { content: { like: 'M%' } },
}
```

Column operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `like`, `ilike`, `isNull`, `isNotNull`, array helpers.

## `orderBy`

```typescript
orderBy: { name: 'asc' }
orderBy: { createdAt: 'desc', id: 'asc' }
```

Nested (on relation): `with: { posts: { orderBy: { createdAt: 'desc' } } }`.

## v1 → v2 (do not use v1 in new code)

| v1                                                    | v2                               |
| ----------------------------------------------------- | -------------------------------- |
| `where: (users, { eq }) => eq(users.id, 1)`           | `where: { id: 1 }`               |
| `orderBy: (users, { desc }) => desc(users.createdAt)` | `orderBy: { createdAt: 'desc' }` |

## SQL builder (core API)

Still valid alongside RQB:

```typescript
import { eq, and, desc } from 'drizzle-orm';

await db.select().from(employeesTable).where(eq(employeesTable.id, 1));
await db.insert(employeesTable).values({ name: 'Ann', birthday: new Date() });
await db.transaction(async (tx) => {
  /* ... */
});
```

Use core API for complex joins/aggregations; use `db.query` for nested relation graphs.
