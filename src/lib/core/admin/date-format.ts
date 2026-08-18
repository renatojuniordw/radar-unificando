/** '2026-08-17' → '17/08/26' (rótulo do eixo dos gráficos). */
export function formatDayShort(key: string): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(2, 4)}`;
}

/** '2026-08-17' → '17/08/2026' (tooltip dos gráficos). */
export function formatDayFull(key: string): string {
  return `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Timestamp → '17/08/2026 14:30' (fuso America/Sao_Paulo). */
export function formatDateTimeSp(date: Date): string {
  return dateTimeFormatter.format(date);
}