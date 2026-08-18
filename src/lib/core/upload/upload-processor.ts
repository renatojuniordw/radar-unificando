import { profileRepository } from '@/lib/infrastructure/repositories';
import { computeResumeHash } from '@/lib/core/upload/resume-hash';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';
import { uploadJobStore, type UploadJobResult } from '@/lib/core/upload/upload-job-store';
import {
  resumeExtractionCache,
  hashContent,
  type ResumeExtractionResult,
} from '@/lib/core/parsing/resume-extraction-cache';

/**
 * Processa um job de upload em background (fire-and-forget, mesmo padrão do
 * runPipeline): extrai skills via LLM, salva o perfil e atualiza o job.
 * O cache por hash evita re-chamar a LLM para o mesmo currículo dentro do TTL.
 */
export async function processUploadJob(
  jobId: string,
  userId: string,
  input: { rawText: string; markdown: string; traceId?: string; profileSource?: string },
): Promise<void> {
  try {
    const hash = hashContent(input.markdown);

    let extracted: ResumeExtractionResult | null = resumeExtractionCache.get(hash);
    if (!extracted) {
      extracted = await extractSkillsFromResume(input.markdown, input.traceId);
      resumeExtractionCache.set(hash, extracted);
    }

    if (extracted.extractionError) {
      uploadJobStore.fail(jobId, `Não foi possível extrair os dados do currículo: ${extracted.extractionError}`);
      return;
    }

    const result: UploadJobResult = {
      skills: extracted.skills,
      experienceYears: extracted.experienceYears,
      seniority: extracted.seniority,
      education: extracted.education,
      currentRole: extracted.currentRole,
      area: extracted.area,
      markdown: input.markdown,
      resumeText: input.rawText,
      count: extracted.skills.length,
    };

    await profileRepository.upsert(userId, {
      resumeText: input.rawText,
      resumeMarkdown: input.markdown,
      resumeHash: computeResumeHash(input.rawText, input.markdown),
      skills: extracted.skills,
      seniority: extracted.seniority || undefined,
      experienceYears: extracted.experienceYears,
      currentRole: extracted.currentRole || undefined,
      area: extracted.area || undefined,
      education: extracted.education,
      profileSource: input.profileSource || 'manual',
      parsedData: { extractedAt: new Date().toISOString() },
    });

    uploadJobStore.complete(jobId, result);
  } catch (error) {
    console.error('[upload] AI extraction failed:', error);
    const message = error instanceof Error ? error.message : 'Falha ao extrair skills via IA';
    uploadJobStore.fail(jobId, message);
  }
}
