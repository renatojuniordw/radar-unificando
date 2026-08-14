const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
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

function relativeLabel(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return relativeFormatter.format(diffMinutes, "minute");
    }
    return relativeFormatter.format(diffHours, "hour");
  }

  return relativeFormatter.format(diffDays, "day");
}

export interface JobDateInfo {
  label: string;
  relative: string;
  full: string;
}

/**
 * Prioriza a data de publicação informada pela plataforma de origem (`postedAt`);
 * cai para `detectedAt` (quando o radar encontrou a vaga) se a primeira faltar/for inválida.
 */
export function formatJobDate(postedAt?: string, detectedAt?: string): JobDateInfo | null {
  const postedAtDate = postedAt ? parseDate(postedAt) : null;
  if (postedAtDate) {
    return { label: "Publicada", relative: relativeLabel(postedAtDate), full: fullDateFormatter.format(postedAtDate) };
  }

  const detectedAtDate = detectedAt ? parseDate(detectedAt) : null;
  if (detectedAtDate) {
    return { label: "Adicionada", relative: relativeLabel(detectedAtDate), full: fullDateFormatter.format(detectedAtDate) };
  }

  return null;
}
