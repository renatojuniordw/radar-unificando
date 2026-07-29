import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/infrastructure/db/schema/*',
  out: './src/lib/infrastructure/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
