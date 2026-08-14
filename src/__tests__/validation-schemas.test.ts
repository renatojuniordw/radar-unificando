import { describe, it, expect } from 'vitest';
import {
  registerCredentialsSchema,
  registerFormSchema,
} from '@/lib/core/auth/register-schema';
import { pipelineStartSchema } from '@/lib/core/pipeline/pipeline-schema';
import { profileUpdateSchema } from '@/lib/core/profile/profile-schema';

describe('registerCredentialsSchema (compartilhado client/server)', () => {
  it('deve_aceitar_credenciais_validas', () => {
    const result = registerCredentialsSchema.safeParse({
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'SenhaForte@1',
    });
    expect(result.success).toBe(true);
  });

  it('deve_rejeitar_email_invalido', () => {
    const result = registerCredentialsSchema.safeParse({
      email: 'nao-e-email',
      password: 'SenhaForte@1',
    });
    expect(result.success).toBe(false);
  });

  it('deve_rejeitar_senha_fraca_sem_especial', () => {
    const result = registerCredentialsSchema.safeParse({
      email: 'ana@exemplo.com',
      password: 'Senhafraca1',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerFormSchema (client: confirmação de senha)', () => {
  it('deve_rejeitar_confirmacao_divergente', () => {
    const result = registerFormSchema.safeParse({
      email: 'ana@exemplo.com',
      password: 'SenhaForte@1',
      confirmPassword: 'OutraSenha@1',
    });
    expect(result.success).toBe(false);
  });
});

describe('pipelineStartSchema', () => {
  it('deve_aceitar_payload_padrao_e_preencher_defaults', () => {
    const result = pipelineStartSchema.safeParse({ auto: true });
    expect(result.success).toBe(true);
    expect(result.data?.companies).toEqual([]);
    expect(result.data?.queries).toEqual([]);
  });

  it('deve_rejeitar_companies_nao_array', () => {
    const result = pipelineStartSchema.safeParse({ companies: 'gupy' });
    expect(result.success).toBe(false);
  });

  it('deve_rejeitar_array_com_mais_de_20_termos', () => {
    const result = pipelineStartSchema.safeParse({
      queries: Array.from({ length: 21 }, (_, i) => `cargo-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe('profileUpdateSchema', () => {
  it('deve_aceitar_perfil_valido', () => {
    const result = profileUpdateSchema.safeParse({
      skills: ['React', 'TypeScript'],
      currentRole: 'Dev',
      experienceYears: 5,
    });
    expect(result.success).toBe(true);
  });

  it('deve_rejeitar_skills_nao_array', () => {
    const result = profileUpdateSchema.safeParse({ skills: 'React' });
    expect(result.success).toBe(false);
  });

  it('deve_rejeitar_experienceYears_negativo', () => {
    const result = profileUpdateSchema.safeParse({ experienceYears: -1 });
    expect(result.success).toBe(false);
  });
});
