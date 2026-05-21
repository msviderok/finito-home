import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-valibot';

export const employeesTable = sqliteTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  birthday: integer('birthday', { mode: 'timestamp_ms' }).notNull(),
});

export const employeeSelectSchema = createSelectSchema(employeesTable);
export const employeeInsertSchema = createInsertSchema(employeesTable);
export const employeeUpdateSchema = createUpdateSchema(employeesTable);

export type SelectEmployee = typeof employeesTable.$inferSelect;
export type InsertEmployee = typeof employeesTable.$inferInsert;
