import { pgTable, uuid, varchar, text, real, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { jobs } from './jobs';

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  stage: varchar('stage').notNull().default('discovered'),
  score: real('score'),
  breakdown: jsonb('breakdown'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
