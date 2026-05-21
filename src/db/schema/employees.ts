import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-valibot';

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  birthday: integer('birthday', { mode: 'timestamp_ms' }).notNull(),
});

export const employeeSelectSchema = createSelectSchema(employees);
export const employeeInsertSchema = createInsertSchema(employees);
export const employeeUpdateSchema = createUpdateSchema(employees);

export type SelectEmployee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
