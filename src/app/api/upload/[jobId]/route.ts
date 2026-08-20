import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, staleSessionResponse, STALE_SESSION_ERROR_CODE } from '@/lib/api/auth-guard';
import { uploadJobStore } from '@/lib/core/upload/upload-job-store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { jobId } = await params;

  const job = uploadJobStore.findById(jobId);
  if (!job || job.userId !== session.user.id) {
    return NextResponse.json({ error: 'Upload não encontrado' }, { status: 404 });
  }

  // Job falhou por FK violation (JWT aponta pra user.id que não existe mais):
  // mesmo tratamento das rotas síncronas (401 + limpa cookie de sessão).
  if (job.status === 'failed' && job.error === STALE_SESSION_ERROR_CODE) {
    return staleSessionResponse();
  }

  // Retorna só o necessário para o polling do cliente
  return NextResponse.json({
    status: job.status,
    ...(job.result ? { result: job.result } : {}),
    ...(job.error ? { error: job.error } : {}),
  });
}
