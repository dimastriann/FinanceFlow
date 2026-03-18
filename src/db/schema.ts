import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  merchant: text('merchant').notNull(),
  note: text('note'),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  date: integer('date').notNull(), // Timestamp
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => categories.id), // Nullable for overall budget
  amount: real('amount').notNull(),
  period: text('period').notNull(), // e.g., "current" or "2024-03"
});

export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(), // We'll just use 'current'
  userName: text('user_name').notNull().default('John Doe'),
  theme: text('theme').notNull().default('dark'),
  currency: text('currency').notNull().default('USD'),
  isBiometricEnabled: integer('is_biometric_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  isAmountHidden: integer('is_amount_hidden', { mode: 'boolean' })
    .notNull()
    .default(false),
});

export const budgetLogs = sqliteTable('budget_logs', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  previousAmount: real('previous_amount'),
  categoryId: text('category_id').references(() => categories.id),
  period: text('period').notNull(),
  date: integer('date').notNull(), // Timestamp
});
