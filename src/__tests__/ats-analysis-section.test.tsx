// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AtsAnalysisSection } from '@/components/profile/ats-analysis-section';

const RESULT = {
  heuristics: { checks: [{ id: 'contato', label: 'Contato', detail: 'presente', ok: true }] },
  analysis: {
    score: 80,
    summary: 'Currículo alinhado',
    missingKeywords: ['AWS'],
    formattingIssues: [],
    recommendations: ['Adicionar AWS'],
    strengths: ['Experiência clara'],
  },
  cached: false,
};

describe('AtsAnalysisSection', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should_render_title_and_analyze_button', () => {
    render(<AtsAnalysisSection />);
    expect(screen.getByText('ANÁLISE ATS DO CURRÍCULO')).toBeTruthy();
    expect(screen.getByText('ANALISAR COMPATIBILIDADE ATS')).toBeTruthy();
  });

  it('should_show_loading_state_while_analyzing', async () => {
    let resolveFetch!: (v: Response) => void;
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }));
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(screen.getByText('Analisando...')).toBeTruthy();
    resolveFetch({ ok: true, json: async () => RESULT } as any);
    await waitFor(() => expect(screen.getByText('ANALISAR COMPATIBILIDADE ATS')).toBeTruthy());
  });

  it('should_render_score_and_details_after_analysis', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => RESULT } as any);
    render(<AtsAnalysisSection />);
    fireEvent.change(screen.getByLabelText('Descrição da vaga (opcional)'), { target: { value: 'Vaga de dados' } });
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('80')).toBeTruthy();
    expect(screen.getByText('Ótimo')).toBeTruthy();
    expect(screen.getByText('Currículo alinhado')).toBeTruthy();
    expect(screen.getByText('AWS')).toBeTruthy();
    expect(screen.getByText('Adicionar AWS')).toBeTruthy();
    expect(screen.getByText('Contato:')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/ats/analyze', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ jobDescription: 'Vaga de dados' }),
    }));
  });

  it('should_show_cached_message_when_result_cached', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...RESULT, cached: true }) } as any);
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText(/Resultado em cache/)).toBeTruthy();
  });

  it('should_show_error_from_response_body_when_not_ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Currículo não encontrado' }) } as any);
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('Currículo não encontrado')).toBeTruthy();
  });

  it('should_show_generic_error_when_response_has_no_detail', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => null } as any);
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('Erro ao analisar o currículo.')).toBeTruthy();
  });

  it('should_show_connection_error_when_fetch_throws', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('Erro de conexão. Tente novamente.')).toBeTruthy();
  });

  it('should_show_timeout_message_when_fetch_is_aborted', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
    );
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });

    expect(
      screen.getByText('A análise está demorando mais que o esperado. Tente novamente em instantes.'),
    ).toBeTruthy();
  });

  it('should_label_low_score_as_needs_improvement', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...RESULT, analysis: { ...RESULT.analysis, score: 40 } }) } as any);
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('Precisa melhorar')).toBeTruthy();
  });

  it('should_label_mid_score_as_good', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ...RESULT, analysis: { ...RESULT.analysis, score: 60 } }) } as any);
    render(<AtsAnalysisSection />);
    fireEvent.click(screen.getByText('ANALISAR COMPATIBILIDADE ATS'));
    expect(await screen.findByText('Bom')).toBeTruthy();
  });
});