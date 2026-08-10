import { describe, it, expect } from 'vitest';
import { analyzeAtsHeuristics } from '@/lib/core/ai/ats/ats-heuristics';

function buildResume(overrides: Partial<Record<string, string>> = {}): string {
  const experience =
    overrides.experience ??
    [
      'Aumentei a conversao em 30% com redesign do checkout, reduzi o tempo de carregamento em 40% e liderei um time de 4 pessoas.',
      'Desenvolvi APIs REST com Node.js e TypeScript, integrei sistemas de pagamento e automatizei testes com CI/CD.',
      'Colaborei com designers em sprints ageis e criei bibliotecas de componentes reutilizaveis usadas por 3 squads.',
      'Migrei uma aplicacao legada de jQuery para React, reduzindo o tempo de resposta em 60% e melhorando a cobertura de testes para 85%.',
      'Implementei monitoramento e observabilidade com Grafana e Prometheus, reduzindo incidentes em producao pela metade.',
      'Participei do processo de contratacao e mentoria de 6 desenvolvedores juniores ao longo de 2 anos, com taxa de retencao de 100% no time.',
    ].join('\n');

  const parts = [
    'Maria Silva',
    overrides.email ?? 'maria.silva@empresa.com',
    overrides.phone ?? '(11) 98765-4321',
    'Sao Paulo, SP',
    '',
    'Experiencia',
    'Desenvolvedora Full-Stack com 5 anos de experiencia construindo aplicacoes web de alta escala.',
    experience,
    'Resumo profissional: Engenheira de software com forte atencao a qualidade, performance e experiencia do usuario, buscando novos desafios em produto.',
    '',
    'Formacao',
    'Bacharelado em Ciencia da Computacao - USP, 2018',
    'Pos-graduacao em Arquitetura de Software - PUC, 2021',
    '',
    'Habilidades',
    'React, TypeScript, Node.js, PostgreSQL, AWS, Docker, GraphQL, Jest, Git',
    '',
    'Idiomas',
    'Portugues (Nativo), Ingles (Avancado), Espanhol (Basico)',
  ];
  return parts.join('\n');
}

describe('analyzeAtsHeuristics', () => {
  it('should_score_high_on_complete_resume', () => {
    const result = analyzeAtsHeuristics(buildResume());
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.checks.every((c) => c.ok)).toBe(true);
  });

  it('should_flag_generic_email', () => {
    const result = analyzeAtsHeuristics(buildResume({ email: 'maria@gmail.com' }));
    const check = result.checks.find((c) => c.id === 'email_profissional');
    expect(check?.ok).toBe(false);
  });

  it('should_flag_missing_metrics', () => {
    const result = analyzeAtsHeuristics(buildResume({ experience: 'Responsavel por manter o site da empresa.' }));
    const check = result.checks.find((c) => c.id === 'metricas');
    expect(check?.ok).toBe(false);
  });

  it('should_score_low_on_short_empty_resume', () => {
    const result = analyzeAtsHeuristics('Maria Silva');
    expect(result.score).toBeLessThanOrEqual(33);
    expect(result.checks.filter((c) => !c.ok).length).toBeGreaterThanOrEqual(4);
  });

  it('should_flag_short_resume_length', () => {
    const result = analyzeAtsHeuristics('Maria Silva\n(11) 98765-4321\nmaria@empresa.com');
    const check = result.checks.find((c) => c.id === 'tamanho');
    expect(check?.ok).toBe(false);
  });
});
