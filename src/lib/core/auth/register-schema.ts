// Schema de registro compartilhado entre client (form) e server (API).
// Fonte única de validação — evita divergência front/back.

import { z } from 'zod';

export const registerCredentialsSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string({ message: 'Email é obrigatório' }).trim().email('Email inválido'),
  password: z
    .string({ message: 'Senha é obrigatória' })
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula (A-Z)')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula (a-z)')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número (0-9)')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial (!@#$...)')
    .max(200),
});

/** Form do client: inclui a confirmação de senha (não vai para a API). */
export const registerFormSchema = registerCredentialsSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  });

export type RegisterCredentials = z.infer<typeof registerCredentialsSchema>;
