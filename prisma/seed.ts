import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { provisionAdmin } from './seed/admin-provisioning';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      'Seed: ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env — usuário admin não criado.',
    );
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // Cria o admin se não existir; se existir, garante apenas role='admin'.
  // Nunca sobrescreve a senha de um admin existente (troca feita pelo app
  // sobrevive a deploys).
  const result = await provisionAdmin(prisma, {
    email: adminEmail,
    passwordHash,
    name: process.env.ADMIN_NAME || 'Admin',
  });

  console.log(
    `Seed concluído: admin ${result.email} ${result.created ? 'criado' : 'já existia (role garantida)'}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());