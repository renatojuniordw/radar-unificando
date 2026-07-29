import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const newCompanies = pgTable('new_companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nome: varchar('nome').notNull(),
  totalVagas: integer('total_vagas').default(0),
  urlCarreiras: varchar('url_carreiras'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type NewCompany = typeof newCompanies.$inferSelect;
