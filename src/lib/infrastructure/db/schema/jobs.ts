import { pgTable, uuid, varchar, text, jsonb, real, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 20 }).notNull().default('gupy_api'),
  empresa: varchar('empresa').notNull(),
  plataforma: varchar('plataforma').notNull(),
  naLista: varchar('na_lista', { length: 3 }).default('Não'),
  cargoCategoria: varchar('cargo_categoria'),
  tituloVaga: varchar('titulo_vaga'),
  tipo: varchar('tipo'),
  local: varchar('local'),
  link: varchar('link').notNull(),
  nomeNaPlataforma: varchar('nome_na_plataforma'),
  publicado: varchar('publicado'),
  descricao: text('descricao'),
  skillsRequired: jsonb('skills_required'),
  score: real('score'),
  alerta: varchar('alerta').default(''),
  detectadoEm: varchar('detectado_em'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userJobUnique: uniqueIndex().on(table.userId, table.link),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
