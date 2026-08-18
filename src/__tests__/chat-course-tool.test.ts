import { describe, it, expect, vi, beforeEach } from 'vitest';

const profileMock = vi.fn();

vi.mock('@/lib/infrastructure/repositories', () => ({
  profileRepository: { findByUserId: (...args: unknown[]) => profileMock(...args) },
}));

import { createChatTools } from '@/lib/core/ai/chat-tools';

type ToolResult = {
  cursos: { titulo: string; plataforma: string; skill: string; preco: string; url: string }[];
};

describe('createChatTools.recommend_courses', () => {
  beforeEach(() => {
    profileMock.mockReset();
  });

  it('should_return_structured_udemy_courses_for_tech_skills', async () => {
    profileMock.mockResolvedValue({
      area: 'Desenvolvimento',
      currentRole: 'Dev',
    });

    const tools = createChatTools('user-1');
    const result = (await (
      tools.recommend_courses as unknown as {
        execute: (args: { skills: string[] }) => Promise<ToolResult>;
      }
    ).execute({ skills: ['Kubernetes', 'Docker'] })) as ToolResult;

    expect(result.cursos.length).toBeGreaterThan(0);
    expect(result.cursos.length).toBeLessThanOrEqual(4);
    for (const curso of result.cursos) {
      expect(curso.titulo).toBeTruthy();
      expect(curso.plataforma).toBe('Udemy');
      expect(curso.preco).toBeTruthy();
      expect(curso.url.startsWith('https://')).toBe(true);
    }
  });

  it('should_return_udemy_courses_for_general_area_skill', async () => {
    profileMock.mockResolvedValue({
      area: 'Administrativo',
      currentRole: 'Assistente',
    });

    const tools = createChatTools('user-1');
    const result = (await (
      tools.recommend_courses as unknown as {
        execute: (args: { skills: string[] }) => Promise<ToolResult>;
      }
    ).execute({ skills: ['Excel'] })) as ToolResult;

    expect(result.cursos.length).toBeGreaterThan(0);
    expect(result.cursos[0].plataforma).toBe('Udemy');
  });

  it('should_work_without_logged_in_profile', async () => {
    profileMock.mockResolvedValue(null);

    const tools = createChatTools('user-1');
    const result = (await (
      tools.recommend_courses as unknown as {
        execute: (args: { skills: string[] }) => Promise<ToolResult>;
      }
    ).execute({ skills: ['Python'] })) as ToolResult;

    expect(result.cursos.length).toBeGreaterThan(0);
  });
});