// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
const { useProfileMock } = vi.hoisted(() => ({ useProfileMock: vi.fn() }));

vi.mock('next-auth/react', () => ({ useSession: useSessionMock }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: useProfileMock }));
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));
vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: { getFilters: vi.fn() },
}));
vi.mock('@/components/cursos/course-card', () => ({
  CourseCard: ({ course }: any) => <div>CARD:{course.title}</div>,
}));
vi.mock('@/components/cursos/course-grid', () => ({
  CourseGrid: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/cursos/course-fallback-cta', () => ({
  CourseFallbackCta: () => <div>FALLBACK CTA</div>,
}));
vi.mock('@/components/shared/chat-teaser', () => ({
  ChatTeaser: () => <div>CHAT TEASER</div>,
}));
vi.mock('@/components/ui/section-eyebrow', () => ({
  SectionEyebrow: ({ children }: any) => <div>{children}</div>,
}));

import { browserStorage } from '@/lib/infrastructure/storage/browser-storage';
import CursosPage from '@/app/cursos/page';

describe('CursosPage', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useSessionMock.mockReturnValue({ data: null });
    useProfileMock.mockReturnValue({ area: '', currentRole: '', skills: [] });
    vi.mocked(browserStorage.getFilters).mockResolvedValue(null);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should_render_title_and_popular_skills', () => {
    render(<CursosPage />);
    expect(screen.getByText('CURSOS PARA FECHAR SEUS GAPS')).toBeTruthy();
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByText('Kubernetes')).toBeTruthy();
  });

  it('should_render_featured_courses_for_anonymous_user', () => {
    render(<CursosPage />);
    expect(screen.getByText('Cursos em destaque')).toBeTruthy();
    expect(screen.getByText('FALLBACK CTA')).toBeTruthy();
  });

  it('should_show_chat_teaser_for_anonymous_user', () => {
    render(<CursosPage />);
    expect(screen.getByText('CHAT TEASER')).toBeTruthy();
  });

  it('should_personalize_recommendation_by_last_search', async () => {
    vi.mocked(browserStorage.getFilters).mockResolvedValue({ companies: [], roles: ['Python'] });
    render(<CursosPage />);
    await act(async () => {});
    expect(screen.getByText(/Com base na sua última busca: Python/)).toBeTruthy();
  });

  it('should_search_courses_after_debounce', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ courses: [{ id: 'c1', title: 'Excel Avançado', skillTags: ['excel'] }], source: 'impact' }),
    });
    render(<CursosPage />);
    fireEvent.change(screen.getByPlaceholderText(/Busque por skill/), { target: { value: 'excel' } });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});
    expect(screen.getByText(/Cursos Udemy para "excel"/)).toBeTruthy();
    expect(screen.getByText('CARD:Excel Avançado')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/courses/search', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ query: 'excel' }),
    }));
  });

  it('should_show_curated_results_when_source_is_curated', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ courses: [{ id: 'c2', title: 'SQL para Análise', skillTags: ['sql'] }], source: 'curated' }),
    });
    render(<CursosPage />);
    fireEvent.change(screen.getByPlaceholderText(/Busque por skill/), { target: { value: 'sql' } });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});
    expect(screen.getByText(/Resultados para "sql"/)).toBeTruthy();
  });

  it('should_fall_back_to_catalog_when_search_fails', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<CursosPage />);
    fireEvent.change(screen.getByPlaceholderText(/Busque por skill/), { target: { value: 'python' } });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {});
    expect(screen.getByText(/Resultados para "python"/)).toBeTruthy();
  });

  it('should_not_search_when_query_empty', () => {
    render(<CursosPage />);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});