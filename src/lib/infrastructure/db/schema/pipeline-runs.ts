import { pgTable, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const pipelineRuns = pgTable('pipeline_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  totalJobs: integer('total_jobs').default(0),
  gupyJobs: integer('gupy_jobs').default(0),
  inhireJobs: integer('inhire_jobs').default(0),
  newCompaniesFound: integer('new_companies_found').default(0),
  discoveryEnabled: boolean('discovery_enabled').default(true),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
});

export type PipelineRun = typeof pipelineRuns.$inferSelect;
