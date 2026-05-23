import { migrate } from 'drizzle-orm/libsql/migrator';
import { sql } from 'drizzle-orm';
import { db } from '.';

async function main() {
  await db.run(sql`PRAGMA foreign_keys = OFF`);
  const tables = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
  );
  for (const { name } of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS "${name.replaceAll('"', '""')}"`));
  }
  await db.run(sql`PRAGMA foreign_keys = ON`);
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('Database reset.');
}

void main();
