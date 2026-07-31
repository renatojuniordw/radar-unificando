import { tool } from 'ai';
import { z } from 'zod';
import type { Profile } from '@prisma/client';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeJobFit, JOB_ANALYZER_PROMPT_VERSION, type JobAnalysis } from '@/lib/core/ai/job-analyzer';
import { generateCoverLetter, COVER_LETTER_PROMPT_VERSION } from '@/lib/core/ai/cover-letter-generator';
import { generateInterviewQuestions, INTERVIEW_QUESTIONS_PROMPT_VERSION } from '@/lib/core/ai/interview-questions';
import { computeCacheKey, getCached, saveToCache } from '@/lib/core/ai/generated-content-cache';

const FIT_RANK: Record<JobAnalysis['overallFit'], number> = { high: 3, medium: 2, low: 1 };

async function analyzeWithCache(
  userId: string,
  profile: Profile,
  jobTitle: string,
  jobDescription: string,
): Promise<JobAnalysis> {
  const resumeContext = profile.resumeMarkdown || profile.resumeText || '';
  const skills = (profile.skills as string[]) || [];
  const education = (profile.education as string[]) || [];
  const experienceYears = profile.experienceYears || 0;
  const seniority = profile.seniority || 'pleno';

  // Sem jobId (vaga vem do MCP ao vivo, não persistida) — usa hash do
  // próprio título+descrição no lugar do jobId na chave de cache.
  const cacheKey = computeCacheKey(JOB_ANALYZER_PROMPT_VERSION, [
    jobTitle,
    jobDescription,
    skills,
    experienceYears,
    seniority,
    education,
    resumeContext,
  ]);

  const cached = await getCached<JobAnalysis>(userId, 'fit_analysis', cacheKey);
  if (cached) return cached;

  const traceId = crypto.randomUUID();
  const analysis = await analyzeJobFit(
    resumeContext,
    jobTitle,
    jobDescription,
    skills,
    experienceYears,
    seniority,
    education,
    traceId,
  );

  await saveToCache(userId, 'fit_analysis', cacheKey, analysis);
  return analysis;
}

export function createChatTools(userId: string) {
  return {
    search_jobs: tool({
      description: 'Buscar vagas no Gupy usando uma query de texto. Use palavras-chave como cargo, empresa, ou tecnologia. O resultado inclui a descrição de cada vaga — use-a diretamente em analyze_job_fit, sem precisar de outra busca.',
      inputSchema: z.object({
        query: z.string()
          .min(2, 'Query muito curta')
          .max(200, 'Query muito longa')
          .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Caracteres não permitidos na query')
          .describe('Termo de busca (ex: "Data Analyst", "Python", "Nubank")'),
        limit: z.number().min(1).max(100).optional().default(20).describe('Máximo de resultados'),
      }),
      execute: async ({ query, limit }: { query: string; limit?: number }) => {
        console.log(`[chat-tools] search_jobs chamado com query="${query}" limit=${limit}`);
        const jobs = await gupyMcpClient.searchJobs(query, Math.min(limit || 20, 100));
        return jobs.slice(0, 10).map(j => ({
          titulo: j.titulo_vaga,
          empresa: j.empresa,
          tipo: j.tipo,
          local: j.local,
          link: j.link,
          descricao: j.descricao?.slice(0, 1200),
        }));
      },
    }),

    get_my_profile: tool({
      description: 'Obter o perfil do usuário logado (skills, experiência, senioridade, formação).',
      inputSchema: z.object({}),
      execute: async () => {
        console.log('[chat-tools] get_my_profile chamado');
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };
        return {
          skills: profile.skills,
          experienceYears: profile.experienceYears,
          seniority: profile.seniority,
          currentRole: profile.currentRole,
          area: profile.area,
          education: profile.education || [],
          profileSource: profile.profileSource || 'manual',
          resumeMarkdown: profile.resumeMarkdown?.slice(0, 3000) || null,
        };
      },
    }),

    analyze_job_fit: tool({
      description: 'Analisar a compatibilidade do perfil do usuário com uma vaga específica. Use o título e a descrição já retornados por search_jobs — não invente ou peça um ID.',
      inputSchema: z.object({
        jobTitle: z.string()
          .min(1, 'Título da vaga obrigatório')
          .max(200, 'Título muito longo')
          .trim()
          .describe('Título da vaga (campo "titulo" retornado por search_jobs)'),
        jobDescription: z.string()
          .min(10, 'Descrição muito curta')
          .max(5000, 'Descrição muito longa')
          .trim()
          .describe('Descrição da vaga (campo "descricao" retornado por search_jobs)'),
      }),
      execute: async ({ jobTitle, jobDescription }: { jobTitle: string; jobDescription: string }) => {
        console.log(`[chat-tools] analyze_job_fit chamado com jobTitle="${jobTitle}"`);
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };

        return analyzeWithCache(userId, profile, jobTitle, jobDescription);
      },
    }),

    compare_jobs: tool({
      description: 'Comparar de 2 a 5 vagas entre si quanto à compatibilidade com o perfil do usuário. Use título e descrição já retornados por search_jobs para cada vaga — não invente dados. Retorna os resultados já ordenados do melhor para o pior fit; apresente a comparação ao usuário com base nisso.',
      inputSchema: z.object({
        jobs: z.array(
          z.object({
            jobTitle: z.string().min(1).max(200).trim().describe('Título da vaga (campo "titulo" de search_jobs)'),
            jobDescription: z.string().min(10).max(5000).trim().describe('Descrição da vaga (campo "descricao" de search_jobs)'),
          }),
        ).min(2, 'Informe pelo menos 2 vagas para comparar').max(5, 'Compare no máximo 5 vagas por vez'),
      }),
      execute: async ({ jobs }: { jobs: { jobTitle: string; jobDescription: string }[] }) => {
        console.log(`[chat-tools] compare_jobs chamado com ${jobs.length} vagas`);
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };

        const results = await Promise.all(
          jobs.map(async ({ jobTitle, jobDescription }) => ({
            jobTitle,
            ...(await analyzeWithCache(userId, profile, jobTitle, jobDescription)),
          })),
        );

        results.sort((a, b) => FIT_RANK[b.overallFit] - FIT_RANK[a.overallFit]);
        return { ranking: results };
      },
    }),

    generate_cover_letter: tool({
      description: 'Gerar uma carta de apresentação personalizada do usuário para uma vaga específica. Use título e descrição já retornados por search_jobs — não invente dados.',
      inputSchema: z.object({
        jobTitle: z.string().min(1).max(200).trim().describe('Título da vaga (campo "titulo" de search_jobs)'),
        jobDescription: z.string().min(10).max(5000).trim().describe('Descrição da vaga (campo "descricao" de search_jobs)'),
      }),
      execute: async ({ jobTitle, jobDescription }: { jobTitle: string; jobDescription: string }) => {
        console.log(`[chat-tools] generate_cover_letter chamado com jobTitle="${jobTitle}"`);
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };

        const resumeContext = profile.resumeMarkdown || profile.resumeText || '';
        const skills = (profile.skills as string[]) || [];

        const cacheKey = computeCacheKey(COVER_LETTER_PROMPT_VERSION, [jobTitle, jobDescription, skills, resumeContext]);
        const cached = await getCached(userId, 'cover_letter', cacheKey);
        if (cached) return cached;

        const traceId = crypto.randomUUID();
        const letter = await generateCoverLetter(resumeContext, jobTitle, jobDescription, skills, traceId);

        await saveToCache(userId, 'cover_letter', cacheKey, letter);
        return letter;
      },
    }),

    get_interview_questions: tool({
      description: 'Gerar um roteiro de perguntas de entrevista personalizadas para uma vaga específica, baseado nos pontos fortes e lacunas do perfil do usuário. Use título e descrição já retornados por search_jobs — não invente dados. Após retornar as perguntas, ofereça-se para conduzir uma simulação de entrevista fazendo uma pergunta de cada vez e dando feedback sobre a resposta do usuário.',
      inputSchema: z.object({
        jobTitle: z.string().min(1).max(200).trim().describe('Título da vaga (campo "titulo" de search_jobs)'),
        jobDescription: z.string().min(10).max(5000).trim().describe('Descrição da vaga (campo "descricao" de search_jobs)'),
      }),
      execute: async ({ jobTitle, jobDescription }: { jobTitle: string; jobDescription: string }) => {
        console.log(`[chat-tools] get_interview_questions chamado com jobTitle="${jobTitle}"`);
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };

        const resumeContext = profile.resumeMarkdown || profile.resumeText || '';

        const cacheKey = computeCacheKey(INTERVIEW_QUESTIONS_PROMPT_VERSION, [jobTitle, jobDescription, resumeContext]);
        const cached = await getCached(userId, 'interview_questions', cacheKey);
        if (cached) return cached;

        const { matchedSkills, missingSkills } = await analyzeWithCache(userId, profile, jobTitle, jobDescription);

        const traceId = crypto.randomUUID();
        const questions = await generateInterviewQuestions(
          resumeContext,
          jobTitle,
          jobDescription,
          matchedSkills,
          missingSkills,
          traceId,
        );

        await saveToCache(userId, 'interview_questions', cacheKey, questions);
        return questions;
      },
    }),
  };
}
