import { z } from 'zod';

export const passwordSchema = z
  .string({ message: 'Senha é obrigatória' })
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula (A-Z)')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula (a-z)')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número (0-9)')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial (!@#$...)')
  .max(200);