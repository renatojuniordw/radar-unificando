import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/infrastructure/db/client';
import { users } from '@/lib/infrastructure/db/schema';

export class CompanyRepository {
  async setList(userId: string, names: string[]): Promise<void> {
    // Companies are stored per-user in the profile preferences
    // For now, we use a simple approach: store in the jobs query
    // In v2, we'll have a proper companies table
    const db = getDb();
    // Upsert user with company preferences
    await db.insert(users).values({
      id: userId,
      email: '', // placeholder — won't be used for auth users
      passwordHash: '',
      name: null,
    }).onConflictDoNothing();
  }

  async findAll(userId: string): Promise<string[]> {
    // Return companies from user's jobs
    const db = getDb();
    const { jobs } = await import('@/lib/infrastructure/db/schema');
    const result = await db
      .select({ empresa: jobs.empresa })
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .groupBy(jobs.empresa)
      .orderBy(jobs.empresa);

    return result.map(r => r.empresa);
  }
}
