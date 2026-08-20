// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/client/resume-download', () => ({
  downloadAdaptedResume: vi.fn(),
}));

import { downloadAdaptedResume } from '@/lib/client/resume-download';
import { AtsAnalysisDrawer, type AtsDrawerJob } from '@/components/ats/ats-analysis-drawer';

const heuristics = {
  checks: [{ id: 'contact', ok: true, label: 'Contato', detail: 'Email presente' }],
  totalChecks: 1,
  passedChecks: 1,
};

const analysis = {
  score: 72,
  summary: 'Currículo bom, faltam keywords.',
  strengths: ['Métricas claras'],
  missingKeywords: ['AWS'],
  formattingIssues: ['Sem idiomas'],
  recommendations: ['Adicione palavras-chave'],
};

const okResult = { heuristics, analysis, cached: false };

const job: AtsDrawerJob = {
  id: 'job-1',
  title: 'Desenvolvedor React',
  company: 'Acme',
  description: 'Vaga de React',
};

function mockFetch(impl: (url: string, init?: RequestInit) => unknown) {
  global.fetch = vi.fn(impl as any) as unknown as typeof fetch;
}

function renderDrawer(props: Partial<{ open: boolean; job: AtsDrawerJob | null; onClose: () => void }> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <AtsAnalysisDrawer
      open={props.open ?? true}
      job={props.job ?? job}
      onClose={props.onClose ?? onClose}
    />,
  );
  return { ...utils, onClose };
}

async function waitForReady(text: string | RegExp) {
  await waitFor(() => expect(screen.getByText(text)).toBeTruthy());
}

describe('AtsAnalysisDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_show_loading_then_ready_with_score_after_successful_analysis', async () => {
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    expect(screen.getByText(/ANALISANDO COMPATIBILIDADE ATS/)).toBeTruthy();
    await waitForReady('72');
    expect(screen.getByText('Bom')).toBeTruthy();
    expect(screen.getByText('Currículo bom, faltam keywords.')).toBeTruthy();
    expect(screen.getByText('AWS')).toBeTruthy();
    expect(screen.getByText('Adicione palavras-chave')).toBeTruthy();
    expect(screen.getByText('GERAR CURRÍCULO ADAPTADO')).toBeTruthy();
  });

  it('should_send_job_description_and_job_key_from_id_in_request_body', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, status: 200, json: async () => okResult }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer();
    await waitForReady('72');

    expect(fetchMock).toHaveBeenCalledWith('/api/ats/analyze', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.jobDescription).toBe('Vaga de React');
    expect(body.jobKey).toBe('job-1');
  });

  it('should_build_job_key_from_title_and_company_when_id_is_missing', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, status: 200, json: async () => okResult }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer({ job: { title: 'Analista', company: 'Initech', description: 'x' } });
    await waitForReady('72');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.jobKey).toBe('Analista|Initech');
  });

  it('should_omit_job_description_when_job_has_none', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, status: 200, json: async () => okResult }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer({ job: { id: 'j', title: 'T', company: 'C' } });
    await waitForReady('72');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.jobDescription).toBeUndefined();
  });

  it('should_not_analyze_when_drawer_is_closed', () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    renderDrawer({ open: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should_show_error_stage_with_api_error_message_and_retry_button', async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 500, json: async () => ({ error: 'Erro interno' }) }));
    renderDrawer();

    await waitForReady('Erro interno');
    expect(screen.getByRole('button', { name: 'TENTAR NOVAMENTE' })).toBeTruthy();
  });

  it('should_reanalyze_when_retry_clicked_from_error_stage', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Erro interno' }) })
      .mockResolvedValue({ ok: true, status: 200, json: async () => okResult });
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer();
    await waitForReady('Erro interno');

    fireEvent.click(screen.getByRole('button', { name: 'TENTAR NOVAMENTE' }));
    await waitForReady('72');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' })).toBeTruthy();
  });

  it('should_show_generic_error_when_error_response_has_no_message', async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 500, json: async () => ({}) }));
    renderDrawer();

    await waitForReady('Erro ao analisar o currículo.');
  });

  it('should_show_generic_error_when_response_body_is_not_json', async () => {
    mockFetch(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('invalid json');
        },
      }),
    );
    renderDrawer();

    await waitForReady('Erro ao analisar o currículo.');
  });

  it('should_show_connection_error_stage_when_fetch_rejects', async () => {
    mockFetch(() => Promise.reject(new Error('network down')));
    renderDrawer();

    await waitForReady('Erro de conexão. Tente novamente.');
  });

  it('should_show_rate_limited_stage_with_formatted_countdown', async () => {
    vi.useFakeTimers();
    mockFetch(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED', retryAfter: 125 }),
      }),
    );
    renderDrawer();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('Limite diário atingido')).toBeTruthy();
    expect(screen.getByText(/Tente novamente em aproximadamente 2min 05s/)).toBeTruthy();
    expect(screen.getByText('2min 05s')).toBeTruthy();
  });

  it('should_format_countdown_in_hours_for_large_retry_after', async () => {
    vi.useFakeTimers();
    mockFetch(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED', retryAfter: 7200 }),
      }),
    );
    renderDrawer();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('2h 00min')).toBeTruthy();
  });

  it('should_decrement_countdown_every_second_and_enable_retry_at_zero', async () => {
    vi.useFakeTimers();
    mockFetch(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED', retryAfter: 2 }),
      }),
    );
    renderDrawer();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText('2s')).toBeTruthy();
    const retryButton = screen.getByRole('button', { name: /disponível em 2s/i });
    expect((retryButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('1s')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText('Disponível agora')).toBeTruthy();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy();
  });

  it('should_reanalyze_when_retry_clicked_after_countdown_reaches_zero', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ code: 'RATE_LIMITED', retryAfter: 1 }),
      })
      .mockResolvedValue({ ok: true, status: 200, json: async () => okResult });
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    fireEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText('72')).toBeTruthy();
  });

  it('should_abort_inflight_request_when_drawer_closes', async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    mockFetch((_url, init) => {
      capturedSignal = init?.signal ?? undefined;
      return new Promise(() => {});
    });

    const { unmount } = renderDrawer();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(capturedSignal?.aborted).toBe(false);

    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('should_abort_request_after_fetch_timeout_and_show_timeout_message', async () => {
    vi.useFakeTimers();
    mockFetch((_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
    );
    renderDrawer();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText(/ANALISANDO/)).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });
    expect(
      screen.getByText('A análise está demorando mais que o esperado. Tente novamente em instantes.'),
    ).toBeTruthy();
  });

  it('should_build_job_key_with_empty_company_and_omit_company_suffix_when_company_missing', async () => {
    const fetchMock = vi.fn((_url: RequestInfo | URL, _init?: RequestInit) =>
      Promise.resolve({ ok: true, status: 200, json: async () => okResult }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    renderDrawer({ job: { title: 'Título Único' } });
    await waitForReady('72');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.jobKey).toBe('Título Único|');
    expect(screen.getByText('Título Único')).toBeTruthy();
    expect(screen.queryByText(/Título Único — /)).toBeNull();
  });

  it('should_render_checklist_items_with_failing_checks', async () => {
    const mixedHeuristics = {
      checks: [
        { id: 'ok', ok: true, label: 'Contato', detail: 'Presente' },
        { id: 'fail', ok: false, label: 'Idiomas', detail: 'Não listado' },
      ],
      totalChecks: 2,
      passedChecks: 1,
    };
    mockFetch(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ heuristics: mixedHeuristics, analysis, cached: false }),
      }),
    );
    renderDrawer();

    await waitForReady(/Idiomas:/);
    expect(screen.getByText(/Idiomas:/)).toBeTruthy();
    expect(screen.getByText(/Contato:/)).toBeTruthy();
  });

  it('should_pass_empty_company_to_resume_download_when_job_has_none', async () => {
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer({ job: { id: 'j', title: 'Analista' } });

    await waitForReady('72');
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));

    await waitForReady('Currículo adaptado baixado!');
    expect(downloadAdaptedResume).toHaveBeenCalledWith(
      {
        title: 'Analista',
        company: '',
        description: undefined,
      },
      expect.any(Function),
    );
  });

  it('should_close_snackbar_when_alert_close_icon_clicked', async () => {
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await waitForReady('72');
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));
    await waitForReady('Currículo adaptado baixado!');

    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByText('Currículo adaptado baixado!')).toBeNull();
  });

  it('should_show_generic_resume_error_when_rejection_is_not_an_error_instance', async () => {
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockRejectedValue('raw failure string');
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await waitForReady('72');
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));

    await waitForReady('Erro ao gerar o currículo.');
  });

  it('should_auto_close_snackbar_after_auto_hide_duration', async () => {
    vi.useFakeTimers();
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText('Currículo adaptado baixado!')).toBeTruthy();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(screen.queryByText('Currículo adaptado baixado!')).toBeNull();
  });

  it('should_show_score_label_and_boundary_colors', async () => {
    const cases = [
      { score: 30, label: 'Precisa melhorar' },
      { score: 50, label: 'Bom' },
      { score: 75, label: 'Ótimo' },
    ];
    for (const c of cases) {
      mockFetch(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ heuristics, analysis: { ...analysis, score: c.score }, cached: false }),
        }),
      );
      const { unmount } = renderDrawer();
      await waitForReady(String(c.score));
      expect(screen.getByText(c.label)).toBeTruthy();
      unmount();
    }
  });

  it('should_show_cached_hint_when_result_is_from_cache', async () => {
    mockFetch(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ...okResult, cached: true }),
      }),
    );
    renderDrawer();

    await waitForReady('Resultado em cache (currículo já analisado).');
  });

  it('should_generate_adapted_resume_and_show_success_snackbar', async () => {
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await waitForReady('72');
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));

    await waitForReady('Currículo adaptado baixado!');
    expect(downloadAdaptedResume).toHaveBeenCalledWith(
      {
        title: 'Desenvolvedor React',
        company: 'Acme',
        description: 'Vaga de React',
      },
      expect.any(Function),
    );
  });

  it('should_show_error_snackbar_when_resume_download_fails', async () => {
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Falha no PDF'));
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await waitForReady('72');
    fireEvent.click(screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' }));

    await waitForReady('Falha no PDF');
  });

  it('should_ignore_second_generate_resume_click_while_generating', async () => {
    let resolveDownload: (() => void) | undefined;
    (downloadAdaptedResume as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise<void>((resolve) => (resolveDownload = resolve)),
    );
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    renderDrawer();

    await waitForReady('72');
    const generateButton = screen.getByRole('button', { name: 'GERAR CURRÍCULO ADAPTADO' });
    fireEvent.click(generateButton);

    await waitFor(() => expect(screen.getByText('GERANDO...')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'GERANDO...' }));

    expect(downloadAdaptedResume).toHaveBeenCalledTimes(1);
    resolveDownload?.();
  });

  it('should_call_on_close_when_close_button_clicked', async () => {
    mockFetch(() => Promise.resolve({ ok: true, status: 200, json: async () => okResult }));
    const { onClose } = renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
