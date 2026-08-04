import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api/auth-guard', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { upsert: vi.fn() },
}));

vi.mock('@/lib/infrastructure/security/rate-limiter', () => ({
  uploadLimiter: { check: vi.fn().mockReturnValue({ allowed: true }) },
}));

vi.mock('@/lib/core/ai/skill-extractor', () => ({
  extractSkillsFromResume: vi.fn().mockResolvedValue({
    skills: ['React', 'TypeScript'],
    experienceYears: 3,
    seniority: 'pleno',
    currentRole: 'Frontend Developer',
    area: 'Engenharia',
    education: ['Engenharia de Software'],
  }),
}));

vi.mock('@/lib/core/parsing/pdf-to-markdown', () => ({
  pdfToMarkdown: vi.fn().mockResolvedValue('## Experiência\nDesenvolvedor Web com 3 anos em React e TypeScript.'),
  textToMarkdown: vi.fn((t) => t),
}));

import { requireAuth } from '@/lib/api/auth-guard';
import { POST } from '@/app/api/upload/route';
import { NextResponse } from 'next/server';

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 response if user is unauthenticated', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: null as any,
      response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }),
    });

    const req = new Request('http://localhost/api/upload', { method: 'POST' });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('should return 400 if empty file (0 bytes) is uploaded', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: { user: { id: 'user-123' } } as any,
      response: null,
    });

    const formData = new FormData();
    const emptyBlob = new Blob([], { type: 'application/pdf' });
    formData.append('file', emptyBlob, 'Profile.pdf');

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('vazio');
  });

  it('should process text file successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      session: { user: { id: 'user-123' } } as any,
      response: null,
    });

    const formData = new FormData();
    const textBlob = new Blob(['Desenvolvedor Frontend com 5 anos de experiência em React, Node.js e TypeScript.'], { type: 'text/plain' });
    formData.append('file', textBlob, 'resume.txt');

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.skills).toEqual(['React', 'TypeScript']);
  });
});
