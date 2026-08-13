import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

/**
 * GET /api/export
 * Exporta todos os dados pessoais do usuário em formato JSON estruturado (LGPD Art. 18, V — portabilidade).
 * Requer autenticação. Retorna um arquivo JSON pronto para download.
 */
export async function GET() {
  const { session, response } = await requireAuth();
  if (response) return response;

  try {
    const userId = session.user.id;

    // Busca paralela de todas as categorias de dados
    const [user, profile, jobs, chats, chatMessages, pipelineRuns, applications, newCompanies, companyPresence, extensionTokens, extensionFeedback, courseClicks, generatedCache] =
      await Promise.all([
        // Dados da conta
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        }),
        // Perfil profissional
        prisma.profile.findFirst({ where: { userId } }),
        // Vagas salvas
        prisma.job.findMany({
          where: { userId },
          select: {
            id: true, source: true, company: true, platform: true,
            title: true, type: true, location: true, link: true,
            roleCategory: true, score: true, status: true,
            detectedAt: true, createdAt: true,
          },
        }),
        // Conversas (sem mensagens completas — listagem)
        prisma.chat.findMany({
          where: { userId },
          select: { id: true, externalId: true, title: true, createdAt: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        }),
        // Mensagens de chat (conteúdo)
        prisma.chatMessage.findMany({
          where: { chat: { userId } },
          select: { id: true, role: true, content: true, position: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
        // Pipeline
        prisma.pipelineRun.findMany({
          where: { userId },
          select: {
            id: true, status: true, totalJobs: true, gupyJobs: true,
            inhireJobs: true, newCompaniesFound: true, startedAt: true, finishedAt: true,
          },
        }),
        // Candidaturas
        prisma.application.findMany({
          where: { userId },
          select: { id: true, jobId: true, stage: true, score: true, notes: true, createdAt: true },
        }),
        // Empresas descobertas
        prisma.newCompany.findMany({
          where: { userId },
          select: { id: true, name: true, totalJobs: true, careersUrl: true, createdAt: true },
        }),
        // Presença em empresas
        prisma.companyPresence.findMany({
          where: { userId },
          select: {
            id: true, company: true, hasGupy: true, gupyPage: true,
            hasInhire: true, inhirePage: true, totalInhireJobs: true,
          },
        }),
        // Tokens de extensão (apenas metadados — hash não é revelado)
        prisma.extensionToken.findMany({
          where: { userId },
          select: { id: true, createdAt: true, lastUsedAt: true, revokedAt: true },
        }),
        // Feedback da extensão
        prisma.extensionFeedback.findMany({
          where: { userId },
          select: { id: true, rating: true, comment: true, createdAt: true },
        }),
        // Cliques em cursos
        prisma.courseClick.findMany({
          where: { userId },
          select: {
            id: true, courseId: true, skill: true, platform: true,
            origin: true, createdAt: true,
          },
        }),
        // Cache de conteúdo gerado
        prisma.generatedContentCache.findMany({
          where: { userId },
          select: { id: true, kind: true, createdAt: true, expiresAt: true },
        }),
      ]);

    const exportData = {
      _meta: {
        exportedAt: new Date().toISOString(),
        format: 'Radar Unificando — Exportação de Dados Pessoais (LGPD Art. 18, V)',
        version: '1.0',
      },
      account: user,
      // O perfil completo (incluindo o texto do currículo) é dado do próprio
      // titular — omiti-lo comprometeria a portabilidade (Art. 18, V). O export
      // é um download único e iniciado pelo usuário; tamanho não é justificativa.
      profile: profile ?? null,
      jobs,
      chats,
      chatMessages: chatMessages.map((m) => ({
        ...m,
        // Sanitiza conteúdo — remove possíveis dados sensíveis residualmente
        content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content),
      })),
      pipelineRuns,
      applications,
      newCompanies,
      companyPresence,
      extensionTokens: extensionTokens.map((t) => ({
        ...t,
        // Nunca exportar o hash do token
        tokenHash: '[excluído por segurança]',
      })),
      extensionFeedback,
      courseClicks,
      generatedContentCache: generatedCache,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="radar-unificando-dados-${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    console.error('[export] Erro ao exportar dados:', error);
    return NextResponse.json(
      { error: 'Erro ao exportar dados. Tente novamente.' },
      { status: 500 },
    );
  }
}
