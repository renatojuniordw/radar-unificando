/**
 * Usuários sintéticos para E2E, criados no globalSetup via Prisma (seed
 * direto, sem passar pelo rate-limit de registro — 3/dia register_daily).
 * São contas efêmeras de ambiente de teste; credenciais não são segredos.
 * O usuário comum NÃO possui Profile, o que permite testar o estado de
 * falha real do ATS ("Nenhum currículo encontrado").
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

export const E2E_USER = {
  email: "e2e.teste@unificando.com.br",
  password: "E2e!Usuari0#2026",
  name: "Usuário E2E",
  role: "user",
} as const;

export const E2E_ADMIN = {
  email: "e2e.admin@unificando.com.br",
  password: "E2e!Adm1n#2026",
  name: "Admin E2E",
  role: "admin",
} as const;

const BCRYPT_ROUNDS = 12;

/**
 * Cria (ou sincroniza role/senha de) os usuários de teste.
 * Upsert intencional: garante que a senha conhecida pelo spec sempre
 * funcione, mesmo que uma execução anterior a tenha alterado.
 */
export async function seedE2EUsers(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "seedE2EUsers: DATABASE_URL não encontrado. O globalSetup carrega .env.local/.env antes de chamar.",
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const user of [E2E_USER, E2E_ADMIN]) {
      const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      await prisma.user.upsert({
        where: { email: user.email },
        update: { passwordHash, role: user.role },
        create: {
          email: user.email,
          passwordHash,
          name: user.name,
          role: user.role,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}