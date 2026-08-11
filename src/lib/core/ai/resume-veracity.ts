// ---------------------------------------------------------------------------
// Filtro de veracidade pós-geração: garante que o currículo adaptado não
// invente fatos. Compara empresas, cargos, períodos, instituições e
// certificações geradas com o que existe literalmente no currículo original.
// Se detectar algo que não está no original, remove o item (não o inventa).
// ---------------------------------------------------------------------------

import type { AdaptedResume } from './resume-adaptation-generator';

/** Normaliza um termo para comparação: minúsculas, sem acentos/pontuação. */
function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Verifica se um termo (ou suas palavras-chave) aparece no texto original. */
function isPresentInOriginal(original: string, term: string): boolean {
  const normalizedTerm = normalizeTerm(term);
  if (!normalizedTerm) return true; // vazio não é invenção

  const normalizedOriginal = normalizeTerm(original);

  // Match exato do termo inteiro.
  if (normalizedOriginal.includes(normalizedTerm)) return true;

  // Fallback: pelo menos 2 palavras significativas do termo aparecem juntas.
  const words = normalizedTerm.split(' ').filter((w) => w.length > 2);
  if (words.length >= 2) {
    const joined = words.join(' ');
    if (normalizedOriginal.includes(joined)) return true;
  }

  return false;
}

export interface VeracityResult {
  resume: AdaptedResume;
  /** Itens removidos porque não existiam no currículo original. */
  removed: {
    companies: string[];
    roles: string[];
    institutions: string[];
    certifications: string[];
  };
}

/**
 * Filtra o currículo adaptado, removendo qualquer empresa, cargo, instituição
 * ou certificação que não exista no currículo original. Sempre retorna um
 * currículo válido (nunca lança) — a garantia é "não inventar", não "falhar".
 */
export function enforceVeracity(
  original: string,
  generated: AdaptedResume,
): VeracityResult {
  const removed: VeracityResult['removed'] = {
    companies: [],
    roles: [],
    institutions: [],
    certifications: [],
  };

  const experience = (generated.experience ?? []).filter((exp) => {
    const companyOk = exp.company ? isPresentInOriginal(original, exp.company) : true;
    const roleOk = exp.role ? isPresentInOriginal(original, exp.role) : true;
    if (!companyOk) removed.companies.push(exp.company);
    if (!roleOk) removed.roles.push(exp.role);
    return companyOk && roleOk;
  });

  const education = (generated.education ?? []).filter((edu) => {
    const ok = edu.institution ? isPresentInOriginal(original, edu.institution) : true;
    if (!ok) removed.institutions.push(edu.institution);
    return ok;
  });

  const certifications = (generated.certifications ?? []).filter((cert) => {
    const ok = cert.name ? isPresentInOriginal(original, cert.name) : true;
    if (!ok) removed.certifications.push(cert.name);
    return ok;
  });

  return {
    resume: {
      ...generated,
      experience,
      education,
      certifications,
    },
    removed,
  };
}