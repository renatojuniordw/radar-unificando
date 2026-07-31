import { tool } from 'ai';
import { z } from 'zod';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';
import { analyzeJobFit } from '@/lib/core/ai/job-analyzer';

export function createChatTools(userId: string) {
  return {
    search_jobs: tool({
      description: 'Buscar vagas no Gupy usando uma query de texto. Use palavras-chave como cargo, empresa, ou tecnologia.',
      inputSchema: z.object({
        query: z.string().describe('Termo de busca (ex: "Data Analyst", "Python", "Nubank")'),
        limit: z.number().optional().default(20).describe('Máximo de resultados'),
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
          resumeMarkdown: profile.resumeMarkdown?.slice(0, 3000) || null,
        };
      },
    }),

    get_job_details: tool({
      description: 'Obter detalhes de uma vaga específica pelo ID.',
      inputSchema: z.object({
        jobId: z.string().describe('ID da vaga'),
      }),
      execute: async ({ jobId }: { jobId: string }) => {
        console.log(`[chat-tools] get_job_details chamado com jobId="${jobId}"`);
        const job = await jobRepository.findById(jobId);
        if (!job) return { error: 'Vaga não encontrada.' };
        return {
          empresa: job.empresa,
          titulo: job.tituloVaga,
          descricao: job.descricao?.slice(0, 2000),
          tipo: job.tipo,
          local: job.local,
          link: job.link,
          plataforma: job.plataforma,
          publicado: job.publicado,
        };
      },
    }),

    analyze_job_fit: tool({
      description: 'Analisar a compatibilidade do perfil do usuário com uma vaga específica.',
      inputSchema: z.object({
        jobId: z.string().describe('ID da vaga para analisar'),
      }),
      execute: async ({ jobId }: { jobId: string }) => {
        console.log(`[chat-tools] analyze_job_fit chamado com jobId="${jobId}"`);
        const [profile, job] = await Promise.all([
          profileRepository.findByUserId(userId),
          jobRepository.findById(jobId),
        ]);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };
        if (!job) return { error: 'Vaga não encontrada.' };

        const traceId = crypto.randomUUID();
        return analyzeJobFit(
          profile.resumeMarkdown || profile.resumeText || '',
          job.tituloVaga || '',
          job.descricao || '',
          (profile.skills as string[]) || [],
          profile.experienceYears || 0,
          profile.seniority || 'pleno',
          (profile.education as string[]) || [],
          traceId,
        );
      },
    }),
  };
}
