// Provisionamento do usuário admin a partir de env vars (usado pelo seed).
// DIP: recebe o PrismaClient injetado — testável com mock e sem acoplar o
// seed ao runtime do app. Nunca sobrescreve a senha de um admin existente:
// a senha trocada pelo app sobrevive a deploys.

import type { PrismaClient } from '@prisma/client';

export interface AdminProvisionInput {
  email: string;
  /** Hash bcrypt da senha (o hashing é responsabilidade do seed). */
  passwordHash: string;
  name?: string;
}

export interface AdminProvisionResult {
  created: boolean;
  email: string;
}

export async function provisionAdmin(
  prisma: PrismaClient,
  input: AdminProvisionInput,
): Promise<AdminProvisionResult> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findFirst({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash: input.passwordHash,
        name: input.name || 'Admin',
        role: 'admin',
      },
    });
    return { created: true, email };
  }

  // Já existe: garante apenas a role — senha existente é preservada.
  await prisma.user.update({
    where: { id: existing.id },
    data: { role: 'admin' },
  });
  return { created: false, email };
}