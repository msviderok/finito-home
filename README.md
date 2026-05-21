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

### Remote Turso (optional)

Create a `.env` file:

```env
TURSO_CONNECTION_URL=https://your-database.turso.io
TURSO_AUTH_TOKEN=your-token
```

Then run `pnpm dbm` and `pnpm dev`.

## Work in progress

- If the scope requires, the role should be a separate table with properly set-up relations to manage users' permissions.
- For this assignment, the year starts on January 1 and ends on December 31, but in the future, there might be a need to set up a custom fiscal year.
- For simplicity, the payslip is going to be stored and executed monthly, but for more complex scenarios, custom payslip cadence should be provided.
- We will use cents for the currency-related amounts to ensure there is no problem with the floating math.
- If in future any payslip can be edited by other users, then payslipLineItems should have the created_by_id as well.
- For real user management, we need to set up a proper authentication and authorization system with TRPC's protected procedure.
- If I had more time, I would have added an ability to change any related entity from the form of any other related entity.
- To emit unnecessary front-end related stuff, there might be a potential to notify the server via cookies about the view-as-of date.
- For payslip creation, a separate view would be beneficial.
- When a payslip is created for a specific month, it should instantly show the error when trying to create one for the same month.
