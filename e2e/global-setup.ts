/**
 * globalSetup do Playwright: garante que os usuários de teste existam antes
 * da suíte rodar. Roda fora do Next.js — por isso carrega o env manualmente
 * (ver helpers/env.ts) antes de instanciar o Prisma.
 */
import { loadEnvFiles } from "./helpers/env";
import { seedE2EUsers } from "./helpers/seed";

export default async function globalSetup(): Promise<void> {
  loadEnvFiles();
  await seedE2EUsers();
}