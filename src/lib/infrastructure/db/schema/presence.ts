import { pgTable, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const companyPresence = pgTable('company_presence', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  empresa: varchar('empresa').notNull(),
  temGupy: varchar('tem_gupy', { length: 3 }).default(''),
  paginaGupy: varchar('pagina_gupy'),
  temInhire: varchar('tem_inhire', { length: 3 }).default(''),
  paginaInhire: varchar('pagina_inhire'),
  totalVagasInhire: integer('total_vagas_inhire').default(0),
});
