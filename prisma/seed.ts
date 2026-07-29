import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@radarunificando.com.br' },
    update: {},
    create: {
      email: 'admin@radarunificando.com.br',
      passwordHash,
      name: 'Admin',
    },
  });

  console.log('Seed concluído:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
