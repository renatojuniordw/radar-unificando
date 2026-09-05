const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const relativeShortFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto", style: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseDate(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Resolve a unidade relativa (minutos/horas/dias) para uma data passada. */
function relativeParts(date: Date): { value: number; unit: Intl.RelativeTimeFormatUnit } {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      return { value: Math.round(diffMs / (1000 * 60)), unit: "minute" };
    }
    return { value: diffHours, unit: "hour" };
  }

  return { value: diffDays, unit: "day" };
}

function relativeLabel(date: Date): string {
  const { value, unit } = relativeParts(date);
  return relativeFormatter.format(value, unit);
}

function relativeShortLabel(date: Date): string {
  const { value, unit } = relativeParts(date);
  return relativeShortFormatter.format(value, unit);
}

export interface JobDateInfo {
  label: string;
  relative: string;
  /** Versão compacta do relativo (ex.: "há 7 h", "há 30 min.") para colunas estreitas. */
  relativeShort: string;
  full: string;
}

/**
 * Prioriza a data de publicação informada pela plataforma de origem (`postedAt`);
 * cai para `detectedAt` (quando o radar encontrou a vaga) se a primeira faltar/for inválida.
 */
export function formatJobDate(postedAt?: string, detectedAt?: string): JobDateInfo | null {
  const postedAtDate = postedAt ? parseDate(postedAt) : null;
  if (postedAtDate) {
    return {
      label: "Publicada",
      relative: relativeLabel(postedAtDate),
      relativeShort: relativeShortLabel(postedAtDate),
      full: fullDateFormatter.format(postedAtDate),
    };
  }

  const detectedAtDate = detectedAt ? parseDate(detectedAt) : null;
  if (detectedAtDate) {
    return {
      label: "Adicionada",
      relative: relativeLabel(detectedAtDate),
      relativeShort: relativeShortLabel(detectedAtDate),
      full: fullDateFormatter.format(detectedAtDate),
    };
  }

  return null;
}

/**
 * Ordena vagas da mais recente para a mais antiga, priorizando `postedAt`
 * (data de publicação na plataforma de origem) e caindo para `detectedAt`.
 */
export function sortJobsByRecency<T extends { postedAt?: string; detectedAt?: string }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const dateA = new Date(a.postedAt ?? a.detectedAt ?? 0).getTime();
    const dateB = new Date(b.postedAt ?? b.detectedAt ?? 0).getTime();
    return dateB - dateA;
  });
}
