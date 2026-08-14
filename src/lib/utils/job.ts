export function normalizeJobType(tipo: string | undefined | null): string {
  const t = (tipo || '').toLowerCase();
  if (
    t.includes('remote') ||
    t.includes('remoto') ||
    t.includes('remota') ||
    t.includes('home office') ||
    t.includes('work from home') ||
    t.includes('wfh')
  ) {
    return 'Remota';
  }
  if (t.includes('hybrid') || t.includes('hibrido') || t.includes('híbrido')) return 'Híbrida';
  if (
    t.includes('on-site') ||
    t.includes('onsite') ||
    t.includes('on site') ||
    t.includes('in-office') ||
    t.includes('in office') ||
    t.includes('in-person') ||
    t.includes('presencial')
  ) {
    return 'Presencial';
  }
  return tipo || '';
}
