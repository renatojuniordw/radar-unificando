import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
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

  // Retorna só o necessário para o polling do cliente
  return NextResponse.json({
    status: job.status,
    ...(job.result ? { result: job.result } : {}),
    ...(job.error ? { error: job.error } : {}),
  });
}
