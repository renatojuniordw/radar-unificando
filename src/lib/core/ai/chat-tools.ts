import { tool } from 'ai';
import { z } from 'zod';
import { gupyMcpClient } from '@/lib/core/mcp/gupy-client';
import { profileRepository, jobRepository } from '@/lib/infrastructure/repositories';

export function createChatTools(userId: string) {
  return {
    search_jobs: tool({
      description: 'Buscar vagas no Gupy usando uma query de texto. Use palavras-chave como cargo, empresa, ou tecnologia.',
      inputSchema: z.object({
        query: z.string().describe('Termo de busca (ex: "Data Analyst", "Python", "Nubank")'),
        limit: z.number().optional().default(20).describe('Máximo de resultados'),
      }),
      execute: async ({ query, limit }: { query: string; limit?: number }) => {
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
        const profile = await profileRepository.findByUserId(userId);
        if (!profile) return { error: 'Perfil não encontrado. Crie seu perfil primeiro.' };
        const parsedData = profile.parsedData as { education?: string[] } | null;
        return {
          skills: profile.skills,
          experienceYears: profile.experienceYears,
          seniority: profile.seniority,
          education: parsedData?.education || [],
        };
      },
    }),

    get_job_details: tool({
      description: 'Obter detalhes de uma vaga específica pelo ID.',
      inputSchema: z.object({
        jobId: z.string().describe('ID da vaga'),
      }),
      execute: async ({ jobId }: { jobId: string }) => {
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
  };
}
