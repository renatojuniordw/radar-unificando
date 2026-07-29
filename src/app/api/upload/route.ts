import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { uploadLimiter } from '@/lib/infrastructure/security/rate-limiter';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { allowed } = uploadLimiter.check(session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: 'Muitos uploads. Tente novamente em 1 hora.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textDirect = formData.get('text') as string | null;

    let text = textDirect || '';

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith('.pdf')) {
        try {
          const pdfjs = await import('pdfjs-dist');
          const data = new Uint8Array(buffer);
          const doc = await pdfjs.getDocument({ data }).promise;
          const pages = [];
          for (let i = 1; i <= Math.min(doc.numPages, 20); i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            pages.push(content.items.map((item: any) => item.str).join(' '));
          }
          text = pages.join('\n');
        } catch {
          return NextResponse.json({ error: 'Não foi possível ler o PDF. Formatos aceitos: PDF do LinkedIn.' }, { status: 400 });
        }
      } else {
        text = buffer.toString('utf-8');
      }
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Texto muito curto. Cole o conteúdo do currículo.' }, { status: 400 });
    }

    const extracted = await extractSkillsFromResume(text);

    await profileRepository.upsert(session.user.id, {
      resumeText: text,
      skills: extracted.skills,
      seniority: extracted.seniority || undefined,
      experienceYears: extracted.experience,
      parsedData: { education: extracted.education, extractedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      skills: extracted.skills,
      experience: extracted.experience,
      seniority: extracted.seniority,
      education: extracted.education,
      count: extracted.skills.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar upload' },
      { status: 500 }
    );
  }
}
