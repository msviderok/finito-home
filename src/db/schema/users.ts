import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-valibot';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);
export const userInsertSchema = createInsertSchema(usersTable);
export const userUpdateSchema = createUpdateSchema(usersTable);

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
