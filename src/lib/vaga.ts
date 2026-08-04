export function normalizarModalidade(tipo: string | undefined | null): string {
  const t = (tipo || '').toLowerCase();
  if (t.includes('remote') || t.includes('remoto')) return 'Remota';
  if (t.includes('hybrid') || t.includes('hibrido') || t.includes('híbrido')) return 'Híbrida';
  if (t.includes('on-site') || t.includes('presencial') || t === 'on-site') return 'Presencial';
  return tipo || '';
}
