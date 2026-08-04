import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { uploadLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';
import { pdfToMarkdown, textToMarkdown } from '@/lib/core/parsing/pdf-to-markdown';

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

    let extracted;
    try {
      extracted = await extractSkillsFromResume(markdown, traceId);
    } catch (extractError) {
      console.error('[upload] AI extraction failed:', extractError);
      const msg = extractError instanceof Error ? extractError.message : 'Falha ao extrair skills via IA';
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    await profileRepository.upsert(session.user.id, {
      resumeText: rawText,
      resumeMarkdown: markdown,
      skills: extracted.skills,
      seniority: extracted.seniority || undefined,
      experienceYears: extracted.experienceYears,
      currentRole: extracted.currentRole || undefined,
      area: extracted.area || undefined,
      education: extracted.education,
      profileSource: 'linkedin',
      parsedData: { extractedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      skills: extracted.skills,
      experience: extracted.experienceYears,
      seniority: extracted.seniority,
      currentRole: extracted.currentRole,
      area: extracted.area,
      education: extracted.education,
      markdown,
      resumeText: rawText,
      count: extracted.skills.length,
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro ao processar upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
