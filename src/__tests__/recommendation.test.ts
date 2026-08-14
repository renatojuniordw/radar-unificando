import { describe, it, expect } from 'vitest';
import { buildProfileTokens, rankJobsByProfile } from '@/lib/core/matching/recommendation';

describe('buildProfileTokens', () => {
  it('normaliza texto (lowercase, sem acentos)', () => {
    const tokens = buildProfileTokens({
      currentRole: 'Engenheiro de Dados',
      area: 'Dados',
      skills: ['Python', 'SQL'],
    });
    expect(tokens).toContain('engenheiro');
    expect(tokens).toContain('dados');
    expect(tokens).toContain('python');
    expect(tokens).toContain('sql');
  });

  it('remove stopwords PT', () => {
    const tokens = buildProfileTokens({
      currentRole: 'Analista de Dados Sênior',
      area: null,
      skills: [],
    });
    expect(tokens).not.toContain('de');
    expect(tokens).not.toContain('dos');
    expect(tokens).not.toContain('das');
    expect(tokens).toContain('analista');
    expect(tokens).toContain('dados');
    expect(tokens).toContain('senior');
  });

  it('limita skills a 10 tokens', () => {
    const manySkills = Array.from({ length: 20 }, (_, i) => `Skill${i}`);
    const tokens = buildProfileTokens({
      currentRole: null,
      area: null,
      skills: manySkills,
    });
    expect(tokens.length).toBeLessThanOrEqual(10);
  });

  it('deduplica tokens', () => {
    const tokens = buildProfileTokens({
      currentRole: 'Engenheiro de Dados',
      area: 'Dados',
      skills: ['Dados'],
    });
    const dadosCount = tokens.filter(t => t === 'dados').length;
    expect(dadosCount).toBe(1);
  });

  it('retorna vazio para perfil vazio', () => {
    const tokens = buildProfileTokens({
      currentRole: null,
      area: null,
      skills: [],
    });
    expect(tokens).toEqual([]);
  });
});

describe('rankJobsByProfile', () => {
  const mockJobs = [
    {
      title: 'Engenheiro de Dados Senior',
      companyNameOnPlatform: 'Nubank',
      roleCategory: 'Dados',
      company: 'Nubank',
      postedAt: '2026-08-01T00:00:00.000Z',
      detectedAt: '2026-08-01T00:00:00.000Z',
    },
    {
      title: 'Analista de Marketing',
      companyNameOnPlatform: 'Ambev',
      roleCategory: 'Marketing',
      company: 'Ambev',
      postedAt: '2026-08-05T00:00:00.000Z',
      detectedAt: '2026-08-05T00:00:00.000Z',
    },
    {
      title: 'Desenvolvedor Full Stack',
      companyNameOnPlatform: 'iFood',
      roleCategory: 'Engenharia',
      company: 'iFood',
      postedAt: '2026-08-03T00:00:00.000Z',
      detectedAt: '2026-08-03T00:00:00.000Z',
    },
  ];

  it('ordena por score decrescente', () => {
    const tokens = ['engenheiro', 'dados'];
    const ranked = rankJobsByProfile(mockJobs, tokens);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1]?.score || 0);
  });

  it('ordena pela vaga mais nova primeiro (postedAt desc)', () => {
    const tokens = ['dados', 'marketing', 'desenvolvedor']; // matcha os 3 jobs
    const ranked = rankJobsByProfile(mockJobs, tokens);
    expect(ranked.map(r => r.job.title)).toEqual([
      'Analista de Marketing', // 2026-08-05
      'Desenvolvedor Full Stack', // 2026-08-03
      'Engenheiro de Dados Senior', // 2026-08-01
    ]);
  });

  it('filtra jobs com score 0', () => {
    const tokens = ['marketing']; // Só matcha com o segundo job
    const ranked = rankJobsByProfile(mockJobs, tokens);
    expect(ranked.every(r => r.score > 0)).toBe(true);
    expect(ranked.length).toBe(1); // Só o job de marketing
  });

  it('é case-insensitive', () => {
    const tokens = ['ENGENHEIRO', 'DADOS'];
    const ranked = rankJobsByProfile(mockJobs, tokens);
    expect(ranked.length).toBe(1); // Matcha com o primeiro job
  });

  it('lida com campos nulos', () => {
    const jobsWithNulls = [
      {
        title: null,
        companyNameOnPlatform: null,
        roleCategory: 'Dados',
        company: 'Teste',
        postedAt: null,
        detectedAt: null,
      },
    ];
    const tokens = ['dados'];
    const ranked = rankJobsByProfile(jobsWithNulls, tokens);
    expect(ranked.length).toBe(1);
  });

  it('retorna vazio para tokens vazios', () => {
    const ranked = rankJobsByProfile(mockJobs, []);
    expect(ranked).toEqual([]);
  });
});
