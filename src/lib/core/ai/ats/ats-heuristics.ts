// ---------------------------------------------------------------------------
// Heurísticas determinísticas de análise ATS (custo zero, instantâneas).
// Checam sinais objetivos no texto do currículo. Não substituem o score LLM:
// complementam com um checklist rápido e transparente.
// ---------------------------------------------------------------------------

export interface AtsCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface AtsHeuristic {
  checks: AtsCheck[];
  score: number; // 0-100 derivado das heurísticas
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}/;
const SECTION_RE = /(experi[êe]ncia|forma[çc][ãa]o|educa[çc][ãa]o|habilidades|skills|idiomas|contato)/i;
const METRIC_RE = /\d+\s*(%|milh|mil|k|r\$|usu[áa]rios|clientes|projetos|pessoas|redu[çc][ãa]o|aumento|dashboards)/i;
const GENERIC_EMAIL_RE = /(gmail|hotmail|outlook|yahoo|bol)\.com/i;

const MIN_WORDS = 150; // ~1 página
const MAX_WORDS = 900; // ~2 páginas

export function analyzeAtsHeuristics(resumeText: string): AtsHeuristic {
  const text = resumeText || '';
  const checks: AtsCheck[] = [];

  const hasEmail = EMAIL_RE.test(text);
  checks.push({
    id: 'contato',
    label: 'Dados de contato',
    ok: hasEmail,
    detail: hasEmail
      ? 'E-mail presente.'
      : 'Sem e-mail identificável — o ATS não consegue te contatar.',
  });

  const hasPhone = PHONE_RE.test(text);
  checks.push({
    id: 'telefone',
    label: 'Telefone',
    ok: hasPhone,
    detail: hasPhone
      ? 'Telefone presente.'
      : 'Sem telefone — adicione para facilitar o contato.',
  });

  const hasSections = SECTION_RE.test(text);
  checks.push({
    id: 'secoes',
    label: 'Seções padrão',
    ok: hasSections,
    detail: hasSections
      ? 'Seções (Experiência/Formação/Habilidades) identificadas.'
      : 'Sem seções padrão — o ATS pode não estruturar seu currículo.',
  });

  const hasMetrics = METRIC_RE.test(text);
  checks.push({
    id: 'metricas',
    label: 'Resultados com métricas',
    ok: hasMetrics,
    detail: hasMetrics
      ? 'Há números/resultados mensuráveis.'
      : 'Sem métricas — quantifique resultados (ex: "aumentei X%").',
  });

  const genericEmail = GENERIC_EMAIL_RE.test(text);
  checks.push({
    id: 'email_profissional',
    label: 'E-mail profissional',
    ok: !genericEmail,
    detail: genericEmail
      ? 'E-mail genérico (gmail/hotmail). Prefira um e-mail profissional.'
      : 'E-mail profissional.',
  });

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const okLength = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
  checks.push({
    id: 'tamanho',
    label: 'Tamanho adequado',
    ok: okLength,
    detail: okLength
      ? `${wordCount} palavras (1-2 páginas).`
      : `${wordCount} palavras — o ideal é 1-2 páginas.`,
  });

  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { checks, score };
}
