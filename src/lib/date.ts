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

export interface VagaDateInfo {
  label: string;
  relative: string;
  full: string;
}

/**
 * Prioriza a data de publicação informada pela plataforma de origem (`publicado`);
 * cai para `detectadoEm` (quando o radar encontrou a vaga) se a primeira faltar/for inválida.
 */
export function formatVagaDate(publicado?: string, detectadoEm?: string): VagaDateInfo | null {
  const publicadoDate = publicado ? parseDate(publicado) : null;
  if (publicadoDate) {
    return { label: "Publicada", relative: relativeLabel(publicadoDate), full: fullDateFormatter.format(publicadoDate) };
  }

  const detectadoDate = detectadoEm ? parseDate(detectadoEm) : null;
  if (detectadoDate) {
    return { label: "Adicionada", relative: relativeLabel(detectadoDate), full: fullDateFormatter.format(detectadoDate) };
  }

  return null;
}
