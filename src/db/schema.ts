import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const schoolData = pgTable('school_data', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  dataKey: text('data_key').notNull().default('main'),
  payload: jsonb('payload').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  schoolData: many(schoolData),
}));

export const schoolDataRelations = relations(schoolData, ({ one }) => ({
  user: one(users, {
    fields: [schoolData.userId],
    references: [users.id],
  }),
}));
