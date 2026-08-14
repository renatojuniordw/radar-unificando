import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runRetentionCleanup } from '@/lib/infrastructure/cleanup/retention-cleanup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/cleanup
 *
 * Rotina de retenção de dados (relatório LGPD item 3.7): exclui caches expirados
 * e chats inativos. Deve ser chamada por um agendador externo (cron do VPS,
 * GitHub Actions, etc.) informando o header `x-cron-secret` com o valor de
 * `CRON_SECRET` no ambiente.
 *
 * Exemplo:
 *   curl -H "x-cron-secret: $CRON_SECRET" https://radar.unificando.com.br/api/cron/cleanup
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Rotina de retenção não configurada (CRON_SECRET ausente).' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-cron-secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const result = await runRetentionCleanup();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/cleanup] Erro na rotina de retenção:', error);
    return NextResponse.json({ error: 'Erro na rotina de retenção.' }, { status: 500 });
  }
}
