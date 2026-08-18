import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

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

  const user = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase() },
    update: { role: 'admin', passwordHash },
    create: {
      email: adminEmail.toLowerCase(),
      passwordHash,
      name: process.env.ADMIN_NAME || 'Admin',
      role: 'admin',
    },
  });

  console.log('Seed concluído: admin', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());