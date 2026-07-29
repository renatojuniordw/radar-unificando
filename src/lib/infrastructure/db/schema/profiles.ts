import { pgTable, uuid, varchar, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  skills: jsonb('skills').default('[]'),
  experienceYears: integer('experience_years'),
  seniority: varchar('seniority', { length: 50 }),
  resumeText: text('resume_text'),
  parsedData: jsonb('parsed_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
