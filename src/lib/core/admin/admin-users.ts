import { adminRepository } from '@/lib/infrastructure/repositories';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  tokens: number;
  chatMessages: number;
  searches: number;
  jobs: number;
  courseClicks: number;
  extensionTokens: number;
}

/** Usuários cadastrados com consumo agregado (tokens, chat, buscas, vagas, cursos, extensão). */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const [users, chatUsage, pipelineRuns, jobs, courseClicks, extensionTokens] = await Promise.all([
    adminRepository.listUsers(),
    adminRepository.chatUsageByUser(),
    adminRepository.pipelineRunsByUser(),
    adminRepository.jobsByUser(),
    adminRepository.courseClicksByUser(),
    adminRepository.extensionTokensByUser(),
  ]);

  const chatMap = new Map(chatUsage.map((r) => [r.userId, r]));
  const runMap = new Map(pipelineRuns.map((r) => [r.userId, r.count]));
  const jobMap = new Map(jobs.map((r) => [r.userId, r.count]));
  const clickMap = new Map(courseClicks.map((r) => [r.userId, r.count]));
  const extMap = new Map(extensionTokens.map((r) => [r.userId, r.count]));

  return users.map((u) => ({
    ...u,
    tokens: chatMap.get(u.id)?.tokens ?? 0,
    chatMessages: chatMap.get(u.id)?.messages ?? 0,
    searches: runMap.get(u.id) ?? 0,
    jobs: jobMap.get(u.id) ?? 0,
    courseClicks: clickMap.get(u.id) ?? 0,
    extensionTokens: extMap.get(u.id) ?? 0,
  }));
}