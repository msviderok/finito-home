# Finito Home Assignment

## Start from scratch

**Prerequisites:** [Node.js](https://nodejs.org/), [pnpm](https://pnpm.io/), and the [Vite+](https://viteplus.dev/) CLI (`vp`).

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Apply database migrations (local SQLite file):

   ```bash
   TURSO_CONNECTION_URL=file:local.db TURSO_AUTH_TOKEN=local pnpm dbm
   ```

3. Start the dev server:

   ```bash
   pnpm dev:local
   ```

4. Open [http://localhost:3000](http://localhost:3000).

`dev:local` and the migrate command above use a `local.db` file in the project root. No `.env` file is required for local development.

### Browser compatibility

Month selection uses the native `<input type="month">` (`MonthPicker`). That control is not supported in Mozilla Firefox, so date picking may not work there. For now, use Chrome when reviewing or testing the UI.

### Remote Turso (optional)

Create a `.env` file:

```env
TURSO_CONNECTION_URL=https://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

Then run `pnpm dbm` and `pnpm dev`.

### Tests

```bash
pnpm test
```

## Work in progress

Assignment requirements checklist (`[x]` done, `[ ]` not yet).

### 1. Rate management

- [x] View an employee's rates across payment categories
- [x] Add a new rate (new row with `effectiveFrom`)
- [x] Change an existing rate (same temporal model: new row effective from the view-as-of month)
- [x] Rate history per category

### 2. Payslip creation

- [x] Pick employee (accordion per employee; API currently returns one employee for the demo)
- [x] Pick payslip date (payment month)
- [x] Add line items `{ payment_category, units }`
- [x] On save, validate line items against rates effective on the payslip date
- [x] Display total computed from applicable rates (not stored on the payslip row)

### 3. Effective date selector ("time travel")

- [x] Global control at the top of the screen (`ViewAsOfMonthPicker`)
- [x] **Reading:** rates and payslip line math use the selected effective date
- [x] **Writing:** new/edited rates use `effectiveFrom` = start of the selected month
- [ ] Write-up defending the temporal data model (`rates` rows with `effectiveFrom` + `createdAt`)

### 4. Payslip list with retroactive-change highlight

- [x] List payslips with date and current total (per employee)
- [ ] Detect retroactive change (rate edit after payslip creation changes applicable rate)
- [ ] Visual highlight for affected payslips
- [ ] Show original total and current total side by side
- [ ] Persist original total at creation (needed for accurate "original" vs "current")

### 5. Dismiss a retroactive change

- [ ] Detect which rate edits retroactively affect a payslip
- [ ] Dismiss control on highlighted payslips
- [ ] Dismiss most recent affecting edit first (LIFO)
- [ ] Data model for dismissals (soft-delete, dismissal records, etc.)

### Docs, tests, and polish

- [ ] Visual polish — spacing, alignment, and general UI tweaks so it does not look sloppy
- [x] Scaffold tests: create rate, create payslip, edit rate
- [ ] Finish test coverage (retroactive totals, dismiss)
- [ ] Document design choices and tradeoffs
- [ ] Document what would change with more time

### Notes to expand on later (informally written up as a train of thought)

- If the scope requires, the role should be a separate table with properly set-up relations to manage users' permissions.
- For this assignment, the year starts on January 1 and ends on December 31, but in the future, there might be a need to set up a custom fiscal year.
- For simplicity, the payslip is going to be stored and executed monthly, but for more complex scenarios, custom payslip cadence should be provided.
- We will use cents for the currency-related amounts to ensure there is no problem with the floating math.
- If in future any payslip can be edited by other users, then payslipLineItems should have the created_by_id as well.
- For real user management, we need to set up a proper authentication and authorization system with TRPC's protected procedure.
- If I had more time, I would have added an ability to change any related entity from the form of any other related entity (elaborate on this).
- To emit unnecessary front-end signaling, could potentially notify tRPC procedures about currently viewed date via cookies
- For payslip creation, a separate view would be beneficial.
- When a payslip is created for a specific month, it should instantly show the error when trying to create one for the month that already has a payslip.
