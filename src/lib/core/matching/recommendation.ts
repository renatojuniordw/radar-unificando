// Módulo puro de recomendação por perfil
// Funções testáveis sem dependência de banco de dados

const STOPWORDS_PT = new Set([
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'para', 'por', 'com', 'um', 'uma', 'os', 'as', 'que', 'se', 'não',
  'mais', 'mas', 'ou', 'e', 'a', 'o', 'ao', 'aos', 'às', 'pela', 'pelo',
  'desde', 'até', 'entre', 'sobre', 'sob', 'ante', 'após', 'contra',
  'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo',
  'aqui', 'aí', 'lá', 'cá', 'ali', 'acima', 'abaixo', 'antes', 'depois',
  'então', 'logo', 'ainda', 'já', 'sempre', 'nunca', 'talvez', 'quase',
  'bem', 'muito', 'pouco', 'menos', 'tanto', 'quanto', 'todo', 'toda',
  'todos', 'todas', 'outro', 'outra', 'outros', 'outras', 'mesmo', 'mesma',
  'mesmos', 'mesmas', 'proprio', 'propria', 'proprios', 'proprias',
  'cada', 'algum', 'alguma', 'alguns', 'algumas', 'nenhum', 'nenhuma',
  'ninguém', 'tudo', 'nada', 'como', 'quando', 'onde', 'porque', 'porquê',
  'pois', 'portanto', 'contudo', 'entretanto', 'todavia', 'ademais',
  'além', 'outrossim', 'demais', 'ademais', 'aliás', 'enfim', 'enquanto',
  'conquanto', 'embora', 'apesar', 'embora', 'caso', 'seja', 'caso',
  'contanto', 'provided', 'logo', 'portanto', 'assim', 'entretanto',
]);

/**
 * Normaliza texto: lowercase, remove acentos, remove stopwords PT
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS_PT.has(word))
    .join(' ');
}

/**
 * Extrai tokens normalizados de um perfil
 * - currentRole, area, skills (cap 10)
 * - Deduplicados
 */
export function buildProfileTokens(profile: {
  currentRole: string | null;
  area: string | null;
  skills: string[];
}): string[] {
  const tokens: string[] = [];

  if (profile.currentRole) {
    tokens.push(...normalizeText(profile.currentRole).split(' '));
  }

  if (profile.area) {
    tokens.push(...normalizeText(profile.area).split(' '));
  }

  if (profile.skills) {
    profile.skills.forEach(skill => {
      tokens.push(...normalizeText(skill).split(' '));
    });
  }

  // Deduplica e limita a 10 tokens
  const unique = [...new Set(tokens)].filter(t => t.length > 2);
  return unique.slice(0, 10);
}

/**
 * Calcula score de overlap entre tokens do perfil e campos da vaga
 * - Campos: title, companyNameOnPlatform, roleCategory, company
 * - Retorna score 0-1 (proporção de tokens que matcham)
 */
export function rankJobsByProfile<T extends { title: string | null; companyNameOnPlatform: string | null; roleCategory: string | null; company: string }>(
  jobs: T[],
  tokens: string[]
): Array<{ job: T; score: number }> {
  if (tokens.length === 0) return [];

  const ranked = jobs.map(job => {
    const jobText = [
      job.title || '',
      job.companyNameOnPlatform || '',
      job.roleCategory || '',
      job.company || '',
    ].join(' ');

    const normalizedJob = normalizeText(jobText);
    const jobTokens = new Set(normalizedJob.split(' '));

    let matchCount = 0;
    tokens.forEach(token => {
      if (jobTokens.has(token)) {
        matchCount++;
      }
    });

    const score = matchCount / tokens.length;
    return { job, score };
  });

  // Filtra jobs com score > 0 e ordena por score desc
  return ranked
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
