import { describe, it, expect } from 'vitest';
import { enforceVeracity } from '@/lib/core/ai/resume-veracity';
import type { AdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';

const ORIGINAL = `
Maria Silva
Desenvolvedora Full-Stack
Experiência
Desenvolvedora Full-Stack na Empresa Tech (2020-2024)
Front-end Developer na Agência Web (2018-2020)
Formação
Bacharel em Ciência da Computação — USP
Certificações
AWS Certified Developer
`;

function makeResume(overrides: Partial<AdaptedResume> = {}): AdaptedResume {
  return {
    fullName: 'Maria Silva',
    headline: 'Desenvolvedora Full-Stack',
    contact: {},
    summary: 'Resumo.',
    skills: ['React', 'TypeScript'],
    experience: [
      { role: 'Desenvolvedora Full-Stack', company: 'Empresa Tech', period: '2020-2024', bullets: ['x'] },
    ],
    education: [{ degree: 'Ciência da Computação', institution: 'USP', period: '' }],
    certifications: [{ name: 'AWS Certified Developer', issuer: 'Amazon', year: '2023' }],
    languages: [],
    ...overrides,
  };
}

describe('enforceVeracity', () => {
  it('should_keep_items_present_in_original', () => {
    const { resume, removed } = enforceVeracity(ORIGINAL, makeResume());
    expect(resume.experience).toHaveLength(1);
    expect(resume.education).toHaveLength(1);
    expect(resume.certifications).toHaveLength(1);
    expect(removed.companies).toHaveLength(0);
    expect(removed.roles).toHaveLength(0);
  });

  it('should_remove_invented_company', () => {
    const { resume, removed } = enforceVeracity(
      ORIGINAL,
      makeResume({
        experience: [
          { role: 'Desenvolvedora Full-Stack', company: 'Empresa Tech', period: '2020-2024', bullets: [] },
          { role: 'Assistente Administrativo', company: 'Empresa Inexistente', period: '2024-2025', bullets: [] },
        ],
      }),
    );
    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0].company).toBe('Empresa Tech');
    expect(removed.companies).toContain('Empresa Inexistente');
  });

  it('should_remove_invented_role', () => {
    const { resume, removed } = enforceVeracity(
      ORIGINAL,
      makeResume({
        experience: [
          { role: 'Assistente Administrativo', company: 'Empresa Tech', period: '2020-2024', bullets: [] },
        ],
      }),
    );
    expect(resume.experience).toHaveLength(0);
    expect(removed.roles).toContain('Assistente Administrativo');
  });

  it('should_remove_invented_institution_and_certification', () => {
    const { resume, removed } = enforceVeracity(
      ORIGINAL,
      makeResume({
        education: [
          { degree: 'Administração', institution: 'Universidade Inexistente', period: '' },
        ],
        certifications: [
          { name: 'Certificado Inventado', issuer: 'X', year: '' },
        ],
      }),
    );
    expect(resume.education).toHaveLength(0);
    expect(resume.certifications).toHaveLength(0);
    expect(removed.institutions).toContain('Universidade Inexistente');
    expect(removed.certifications).toContain('Certificado Inventado');
  });

  it('should_keep_empty_experience_when_nothing_matches', () => {
    const { resume } = enforceVeracity(
      ORIGINAL,
      makeResume({
        experience: [
          { role: 'Assistente Administrativo', company: 'Outra Empresa', period: '', bullets: [] },
        ],
      }),
    );
    expect(resume.experience).toHaveLength(0);
  });

  it('should_be_case_and_accent_insensitive', () => {
    const { resume } = enforceVeracity(
      'Desenvolvedora Full-Stack na empresa TECH',
      makeResume({
        experience: [
          { role: 'Desenvolvedora Full-Stack', company: 'Empresa Tech', period: '', bullets: [] },
        ],
      }),
    );
    expect(resume.experience).toHaveLength(1);
  });
});