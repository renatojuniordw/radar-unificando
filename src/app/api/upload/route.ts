import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { uploadLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { pdfToMarkdown, textToMarkdown } from '@/lib/core/parsing/pdf-to-markdown';
import { uploadJobStore } from '@/lib/core/upload/upload-job-store';
import { processUploadJob } from '@/lib/core/upload/upload-processor';

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth();
  if (response) return response;

  const { allowed } = uploadLimiter.check(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'Muitos uploads. Tente novamente em 1 hora.' }, { status: 429 });
  }

  const traceId = crypto.randomUUID();

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textDirect = formData.get('text') as string | null;

    let rawText = '';
    let markdown = '';

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
      }
      if (file.size === 0) {
        return NextResponse.json({ error: 'O arquivo enviado está vazio (0 bytes).' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith('.pdf')) {
        // Magic bytes: PDFs reais começam com "%PDF-" (5 bytes). Um arquivo apenas
        // renomeado para .pdf falha aqui com mensagem clara em vez de erro confuso no parse.
        const header = buffer.subarray(0, 5).toString('latin1');
        if (header !== '%PDF-') {
          return NextResponse.json(
            { error: 'Arquivo inválido: não é um PDF válido. Formato aceito: PDF do LinkedIn.' },
            { status: 400 }
          );
        }

        try {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
          const data = new Uint8Array(buffer);
          const doc = await pdfjs.getDocument({ data }).promise;
          const pages = [];
          for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            pages.push(
              content.items
                .map((item) => ('str' in item ? (item as { str: string }).str : ''))
                .join(' ')
            );
          }
          rawText = pages.join('\n');
          markdown = await pdfToMarkdown(buffer);
        } catch (pdfError) {
          console.error('[upload] PDF parse failed:', pdfError);
          return NextResponse.json({ error: 'Não foi possível ler o PDF. Formatos aceitos: PDF do LinkedIn.' }, { status: 400 });
        }
      } else {
        rawText = buffer.toString('utf-8');
        markdown = textToMarkdown(rawText);
      }
    } else {
      rawText = textDirect || '';
      markdown = textToMarkdown(rawText);
    }

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json({ error: 'Texto muito curto. Cole o conteúdo do currículo.' }, { status: 400 });
    }

    // Fluxo assíncrono: cria o job, dispara o processamento em background e
    // responde na hora com o jobId. O cliente faz polling em GET /api/upload/[jobId].
    // Isso elimina o 504 do nginx (a resposta não fica mais presa na chamada LLM).
    const jobId = crypto.randomUUID();
    uploadJobStore.create(jobId, session.user.id);
    void processUploadJob(jobId, session.user.id, { rawText, markdown, traceId });

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('[upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro ao processar upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
