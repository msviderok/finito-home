# Finito — Home Assignment

## How to Run

**Prerequisites:** [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
# 1. Install dependencies
pnpm install
```

Create a `.env` file. For a local SQLite database, use [local.db](local.db) with the local token or your Turso connection URL and token:

```env
TURSO_CONNECTION_URL=file:local.db
TURSO_AUTH_TOKEN=local

# OR

TURSO_CONNECTION_URL=https://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

```bash
# 2. Apply database migrations and seed the database
pnpm drizzle-kit migrate
pnpm db:seed

# 3. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Run the Tests

```bash
# All tests
pnpm test

# Browser (Playwright) tests only
pnpm test:browser
```

The test suite covers:

- Unit tests for rate resolution, payslip total comparison, and the retroactive diff logic (`payslip-totals.test.ts`)
- Component-level tests for create rate, edit rate, dismiss rate, and create payslip flows using a mocked tRPC layer
- Browser UI tests that drive the full rendered workbench via Playwright, asserting amounts, totals, and mutation payloads end-to-end

The tests were generated entirely with AI assistance. They are useful as a regression net for the demo flows for the purposes of the demo, but they should be treated as AI-generated coverage rather than a carefully hand-designed test strategy.

---

## Tech Stack

A stack I find well-suited to this kind of problem.

**TanStack Start + TanStack Router** — everything I need for full-stack TypeScript without the RSC complexity overhead. No vendor lock-in, great ecosystem, fast-moving community.

**tRPC + TanStack Query** — made for each other. End-to-end type safety from DB to component.

**Drizzle** — close to SQL, no magic, no surprises.

**Valibot** — same idea as Zod, smaller bundle, better tree-shaking. Personal preference lately.

**shadcn/ui + Base UI** — just a perfect design system foundation. IMHO.

**Tailwind** — fastest way to build consistent UI. No-brainer.

**SQLite + Turso** — convenience choice.

---

## Design Choices

### Temporal data model — append-only rates

Every rate change is a new row in the `rates` table. Existing rows are never mutated. A rate has two time fields:

- `effectiveFrom` — the _business date_ from which the rate applies. This is what the user sets via the effective-date picker.
- `createdAt` — the _system timestamp_ of when the row was written. This records when the change entered the system, regardless of the business date it was backdated to.

To resolve "which rate applies to category X on date D," the query filters all rates for that employee and category where `effectiveFrom <= D`, then picks the one with the latest `effectiveFrom`. This is done in application code after a single query, which is simple and correct at current scale.

**Why not a mutable single row?**
Overwriting the existing rate destroys history. You can't detect retroactive changes or revert anything.

**Why not closed intervals (`effectiveTo`)?**
Initially I considered closed intervals — each rate row storing both a start and end date, with the current rate having `effectiveTo = NULL`. The problem is maintenance: every time you insert a new rate, you have to go back and update the previous row's `effectiveTo`. That mutates historical data, creates race conditions around concurrent edits, and makes backdating (inserting a rate in the middle of an existing chain) require multi-row updates. With append-only, you never touch existing rows — the "closing" of an interval is derived at read time from the next row's `effectiveFrom`. The trade-off is that range resolution happens in application code rather than a SQL range predicate, which is the first thing to revisit as history grows.

**Initially I also considered explicit date ranges** — e.g. "this rate applies from March to June only" — which would have required `effectiveTo` to be a user-controlled field rather than a derived one. That's a valid future requirement (fixed-term contracts, custom payslip cadences), but for this demo it added complexity with no payoff, so it was left out.

**`createdAt` — what it adds beyond `effectiveFrom`**
`effectiveFrom` tells you _when a rate is valid_. `createdAt` tells you _when the edit was made_. The two can differ because edits can be backdated. `createdAt` is what makes retroactive detection precise: a rate edit is retroactive to a payslip if its `createdAt` is later than the payslip's `createdAt`, regardless of where its `effectiveFrom` points.

---

### Retroactive detection

When a payslip is created, the server snapshots the applicable rate amount into `createAtAmountCents` on each line item. This is the source of truth for the original total — it doesn't drift as rates change over time.

To detect a retroactive change, the UI computes two totals:

- **Base total** — derived from `createAtAmountCents` (what was true when the payslip was born)
- **View total** — recomputed from rates as they exist at the current effective date

If the two differ, the payslip is highlighted. Both totals are shown side by side.

**Why snapshot `createAtAmountCents` instead of recomputing the base from history?**
Recomputation requires knowing exactly which rates were visible at the moment the payslip was created — filtered by `createdAt`. This works, and the code uses `filterRatesKnownAt` as a fallback for older records that predate the column. But the snapshot is cheaper, simpler, and immune to any future changes in how rate history is stored or pruned. It also makes caching straightforward: the baseline never changes, only the view side does.

---

### Dismiss

Dismiss is currently implemented as a hard delete of the rate row. For the demo this is sufficient — the assignment's dismiss scenario is shallow enough that losing the row is recoverable by recreating it.

In production, dismiss would be a soft delete with a status field (`active`, `reverted`) and a pointer to the previous rate (`previousRateId`), forming a versioned linked list of rate states. Nothing would ever be hard deleted. This would allow undoing a dismiss, auditing the full chain of edits, and reactivating a previously reverted rate without losing any history.

**LIFO ordering**
When multiple rate edits retroactively affect a payslip, dismiss removes them most-recent-first. "Most recent" is determined by `createdAt`, not `effectiveFrom`. Two edits can share the same `effectiveFrom` month (both backdated to January, for example) but have different `createdAt` timestamps. LIFO by `createdAt` is the correct field because it reflects the order in which the edits entered the system, which is what the user expects to undo.

---

### "View as of" date

The effective date picker is a global control that drives both reads and writes:

- **Reads:** rates are resolved as of the selected month; payslip totals are recomputed against rates effective on that date
- **Writes:** new rate rows use `effectiveFrom = start of selected month`

The picker operates at month granularity, which is the simplest meaningful unit for this demo. In production, this would need to be more flexible — different organisations have different fiscal years that can start on different months or specific days, and the effective date resolution logic would need to account for those custom calendars. The month-level picker is a deliberate simplification for demo purposes.

The effective date is stored in `localStorage`. Three approaches were considered:

- **URL param** — tried and rejected. The effective date changing would push entries onto the browser history stack, breaking back/forward navigation in a confusing way.
- **Cookie** — the right production-grade choice. A cookie would let the tRPC server read the effective date directly, eliminating it from every request body. It also opens the door to server-side rendering with the correct date context. Deprioritised here because production-grade security was explicitly out of scope for this assignment.
- **localStorage** — simple, persistent across refreshes, no routing side effects.

---

### Rate history loading

Currently, all rates for an employee are fetched in a single query and resolved in memory. The history popover is populated from the same response. This is acceptable for the demo but would break at scale for two reasons:

1. As the rate revision history grows, the payload grows with it — the vast majority of users would never open the history popover, yet all that data is fetched on every page load regardless.
2. There is no pagination or filtering to exclude reverted or superseded records.

The production fix is to load only the current effective rate per category by default, and fetch history on demand (behind the popover interaction), with proper pagination or infinite scroll. The `filterRatesKnownAt` logic that currently runs in memory would move into the database query as a proper `WHERE createdAt <= ?` predicate, with an index on `(employee_id, payment_category_id, created_at)`.

---

### Payslip total computation

`comparePayslipTotalsAt` currently runs client-side on every payslip row render. In production, with long rate histories and many payslips, this computation should be pre-cached — either in a background job or an in-memory cache on the server. Because `createAtAmountCents` snapshots the baseline, only the "current total at view-as-of date" side needs to be computed and cached. The baseline never changes, so cache invalidation is simple: only the view side needs to be invalidated when a rate is edited.

---

### Indexes

The following indexes would be added as the tables grow:

- `(employee_id, payment_category_id, effective_from)` on `rates` — the primary lookup path for rate resolution
- `(employee_id, payment_category_id, created_at)` on `rates` — for filtering rates known at a given creation time
- `(employee_id, payment_date)` on `payslips` — for listing payslips in date order per employee
- `(payslip_id)` on `payslip_line_items` — already implied by the FK, but worth confirming as explicit

---

## What I'd Change With More Time

### Test coverage

The existing tests cover the happy path for the core flows, but the coverage has gaps. With more time, I'd add:

- Full unit test coverage for every calculation and formatting utility — `findCurrentRateForCategory`, `comparePayslipTotalsAt`, `filterRatesKnownAt`, currency formatters, date helpers
- Browser UI tests for every form interaction: error states, keyboard navigation, accessibility, and edge cases (zero hours, duplicate categories, no rate found for payslip date)
- Tests that assert error messages appear in the right place at the right time, 100% of the time — not just that the happy path succeeds

### UI design system — less hard-coding

The current UI leans on Tailwind utility classes scattered across components, with colours and text sizes often hard-coded inline. I'd consolidate this into a proper variant and size system built on the existing `cva` primitives — so that every component expresses its visual intent through named variants (`size="sm"`, `variant="destructive"`) rather than one-off class strings. This makes the UI more maintainable, especially under AI-assisted iteration where the output tends to drift toward inline styles over structured abstractions.

### UX clarity for payroll specialists

A few things that would genuinely improve the experience for the actual users:

- Every destructive or consequential action (dismiss, rate edit, payslip creation) needs comprehensive tooltip and confirmation copy that explains exactly what will happen and what the consequences are — not just "are you sure?" but "this will change the applicable rate for all payslips dated after January 1st."
- The dismiss flow in particular needs clearer language. "Revert to previous rate" is close, but a payroll specialist needs to understand the downstream effect on existing payslips before they click.
- Configurable views — some users want a dense data table, others want a more spacious layout. Payroll tools are used daily and people have strong preferences. A compact/comfortable toggle would go a long way.
- The payslip creation flow would benefit from a dedicated page rather than an inline form. The inline approach works for the demo but gets cramped when there are many line items, and doesn't give enough room to show validation errors clearly.

---

## Random Thoughts I Had While Working on the Assignment

Raw, unfiltered.

- If the scope requires, the role should be a separate table with properly set-up relations to manage users' permissions.
- For this assignment, the year starts on January 1 and ends on December 31, but in the future, there might be a need to set up a custom fiscal year.
- For simplicity, the payslip is going to be stored and executed monthly, but for more complex scenarios, custom payslip cadence should be provided.
- We will use cents for the currency-related amounts to ensure there is no problem with the floating math.
- If in future any payslip can be edited by other users, then payslipLineItems should have the created_by_id as well.
- For real user management, we need to set up a proper authentication and authorization system with tRPC's protected procedure.
- If I had more time, I would have added an ability to change any related entity from the form of any other related entity.
- To emit unnecessary front-end signaling, could potentially notify tRPC procedures about currently viewed date via cookies.
- For payslip creation, a separate view would be beneficial.
- When a payslip is created for a specific month, it should instantly show the error when trying to create one for the month that already has a payslip.
- There should be a properly complex sanitization of the search parameters, especially dates.
