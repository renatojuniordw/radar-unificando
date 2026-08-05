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
import { profileRepository } from '@/lib/infrastructure/repositories';
import { extractSkillsFromResume } from '@/lib/core/ai/skill-extractor';
import { POST } from '@/app/api/upload/route';
import { GET as GET_JOB } from '@/app/api/upload/[jobId]/route';
import { uploadJobStore } from '@/lib/core/upload/upload-job-store';
import { NextResponse } from 'next/server';

function authOk() {
  vi.mocked(requireAuth).mockResolvedValue({
    session: { user: { id: 'user-123' } } as any,
    response: null,
  });
}

function waitForJob(jobId: string, attempts = 50): Promise<Response> {
  // Aguarda o processamento em background completar (mock resolve rápido)
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < attempts; i++) {
      await new Promise(r => setTimeout(r, 10));
      const res = await GET_JOB(
        new Request(`http://localhost/api/upload/${jobId}`) as any,
        { params: Promise.resolve({ jobId }) } as any,
      );
      if (res.status === 404) {
        reject(new Error('job não encontrado'));
        return;
      }
      const body = await res.clone().json();
      if (body.status === 'completed' || body.status === 'failed') {
        resolve(res);
        return;
      }
    }
    reject(new Error('timeout esperando job'));
  });
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authOk();
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

  it('should return 400 if file is not a real PDF (magic bytes)', async () => {
    const formData = new FormData();
    // Conteúdo que NÃO começa com %PDF-
    const fakePdf = new Blob(['NOTAPDF' + 'x'.repeat(100)], { type: 'application/pdf' });
    formData.append('file', fakePdf, 'Profile.pdf');

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('não é um PDF válido');
    // A extração via LLM não deve ter sido chamada
    expect(extractSkillsFromResume).not.toHaveBeenCalled();
  });

  it('should create a job and process text file asynchronously', async () => {
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
    expect(body.jobId).toBeTruthy();

    // O job deve completar em background e salvar no repositório
    const jobRes = await waitForJob(body.jobId);
    const jobBody = await jobRes.json();
    expect(jobBody.status).toBe('completed');
    expect(jobBody.result.skills).toEqual(['React', 'TypeScript']);
    expect(profileRepository.upsert).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ skills: ['React', 'TypeScript'] }),
    );
  });

  it('should fail the job when LLM extraction fails', async () => {
    vi.mocked(extractSkillsFromResume).mockRejectedValueOnce(new Error('LLM fora do ar'));

    const formData = new FormData();
    const textBlob = new Blob(['Desenvolvedor com 5 anos em React e TypeScript.'], { type: 'text/plain' });
    formData.append('file', textBlob, 'resume.txt');

    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();

    const jobRes = await waitForJob(body.jobId);
    const jobBody = await jobRes.json();
    expect(jobBody.status).toBe('failed');
    expect(jobBody.error).toContain('LLM fora do ar');
  });
});

describe('GET /api/upload/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authOk();
  });

  it('should return 404 for unknown job', async () => {
    const res = await GET_JOB(
      new Request('http://localhost/api/upload/unknown') as any,
      { params: Promise.resolve({ jobId: 'unknown' }) } as any,
    );
    expect(res.status).toBe(404);
  });

  it('should return 404 if job belongs to another user', async () => {
    const job = uploadJobStore.create('job-other-user', 'user-999');
    void job;

    const res = await GET_JOB(
      new Request('http://localhost/api/upload/job-other-user') as any,
      { params: Promise.resolve({ jobId: 'job-other-user' }) } as any,
    );
    expect(res.status).toBe(404);
  });

  it('should return processing status then completed for own job', async () => {
    const job = uploadJobStore.create('job-mine', 'user-123');
    void job;

    // Primeira consulta: processing
    const res1 = await GET_JOB(
      new Request('http://localhost/api/upload/job-mine') as any,
      { params: Promise.resolve({ jobId: 'job-mine' }) } as any,
    );
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.status).toBe('processing');

    // Completa o job e consulta de novo
    uploadJobStore.complete('job-mine', {
      skills: ['Python'],
      experienceYears: 2,
      seniority: null,
      education: [],
      currentRole: null,
      area: null,
      markdown: '## x',
      resumeText: 'Python developer',
      count: 1,
    });
    const res2 = await GET_JOB(
      new Request('http://localhost/api/upload/job-mine') as any,
      { params: Promise.resolve({ jobId: 'job-mine' }) } as any,
    );
    const body2 = await res2.json();
    expect(body2.status).toBe('completed');
    expect(body2.result.skills).toEqual(['Python']);
  });
});
