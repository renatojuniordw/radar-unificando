import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const { requireAuthMock, prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {};
  const modelOps: Record<string, string[]> = {
    user: ['findUnique'],
    profile: ['findFirst'],
    job: ['findMany'],
    chat: ['findMany'],
    chatMessage: ['findMany'],
    pipelineRun: ['findMany'],
    application: ['findMany'],
    newCompany: ['findMany'],
    companyPresence: ['findMany'],
    extensionToken: ['findMany'],
    extensionFeedback: ['findMany'],
    courseClick: ['findMany'],
    generatedContentCache: ['findMany'],
  };
  for (const [model, ops] of Object.entries(modelOps)) {
    prismaMock[model] = Object.fromEntries(ops.map((op) => [op, vi.fn()]));
  }
  return { requireAuthMock: vi.fn(), prismaMock };
});

vi.mock('@/lib/api/auth-guard', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/lib/infrastructure/db/prisma-client', () => ({
  prisma: prismaMock,
}));

import { GET } from '@/app/api/export/route';

const authenticated = {
  session: { user: { id: 'user-1', email: 'user@test.com' } },
  response: null,
};

function unauthorized(): any {
  return { session: null, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
}

describe('GET /api/export (LGPD Art. 18, V — portabilidade)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthMock.mockResolvedValue(authenticated);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User',
      createdAt: new Date('2026-01-01'),
    });
    prismaMock.profile.findFirst.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      resumeText: 'Meu currículo completo com experiência em dados.',
      resumeMarkdown: '# Currículo',
      skills: ['SQL', 'Python'],
    });
    prismaMock.job.findMany.mockResolvedValue([]);
    prismaMock.chat.findMany.mockResolvedValue([]);
    prismaMock.chatMessage.findMany.mockResolvedValue([]);
    prismaMock.pipelineRun.findMany.mockResolvedValue([]);
    prismaMock.application.findMany.mockResolvedValue([]);
    prismaMock.newCompany.findMany.mockResolvedValue([]);
    prismaMock.companyPresence.findMany.mockResolvedValue([]);
    prismaMock.extensionToken.findMany.mockResolvedValue([
      { id: 'tok-1', tokenHash: 'abcdef', createdAt: new Date(), lastUsedAt: null, revokedAt: null },
    ]);
    prismaMock.extensionFeedback.findMany.mockResolvedValue([]);
    prismaMock.courseClick.findMany.mockResolvedValue([]);
    prismaMock.generatedContentCache.findMany.mockResolvedValue([]);
  });

  it('should_return_401_when_not_authenticated', async () => {
    requireAuthMock.mockResolvedValue(unauthorized());
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('should_include_full_resume_text_in_export', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = JSON.parse(await res.text());

    expect(data.profile.resumeText).toBe('Meu currículo completo com experiência em dados.');
    expect(data.profile.resumeMarkdown).toBe('# Currículo');
    // Regressão (validação V-2): o texto do currículo não pode vir substituído por placeholder
    expect(data.profile.resumeText).not.toContain('incluído no export completo');
    expect(data.profile.skills).toEqual(['SQL', 'Python']);
  });

  it('should_never_expose_extension_token_hash', async () => {
    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(data.extensionTokens[0].tokenHash).toBe('[excluído por segurança]');
    expect(JSON.stringify(data)).not.toContain('abcdef');
  });

  it('should_stringify_chat_message_content_objects', async () => {
    prismaMock.chatMessage.findMany.mockResolvedValue([
      { id: 'm1', role: 'user', content: { type: 'text', text: 'olá' }, position: 0, createdAt: new Date() },
    ]);
    const res = await GET();
    const data = JSON.parse(await res.text());

    expect(data.chatMessages[0].content).toBe('{"type":"text","text":"olá"}');
  });

  it('should_set_download_headers', async () => {
    const res = await GET();
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('radar-unificando-dados-user-1.json');
  });

  it('should_return_500_with_generic_message_on_error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('DB down'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Erro ao exportar dados. Tente novamente.');
    expect(body.error).not.toContain('DB down');
  });
});
