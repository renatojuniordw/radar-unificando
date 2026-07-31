import { tool } from 'ai';
import { z } from 'zod';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { profileRepository } from '@/lib/infrastructure/repositories';
import { analyzeJobFit } from '@/lib/core/ai/job-analyzer';

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

        const traceId = crypto.randomUUID();
        return analyzeJobFit(
          profile.resumeMarkdown || profile.resumeText || '',
          jobTitle,
          jobDescription,
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
