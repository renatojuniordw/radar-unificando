// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { GeneratedResumesTab } from '@/components/profile/generated-resumes-tab';
import { downloadAdaptedResume, downloadAdaptedResumeDocx } from '@/lib/client/resume-download';

vi.mock('@/lib/client/resume-download', () => ({
  downloadAdaptedResume: vi.fn(),
  downloadAdaptedResumeDocx: vi.fn(),
}));

const downloadAdaptedResumeMock = downloadAdaptedResume as Mock;
const downloadAdaptedResumeDocxMock = downloadAdaptedResumeDocx as Mock;

const fetchMock = vi.fn();

const RESUME_ITEM = {
  id: 'r1',
  jobTitle: 'Analista de Dados',
  jobCompany: 'ACME',
  jobLocation: 'São Paulo',
  createdAt: '2026-09-01T10:00:00.000Z',
  expiresAt: '2026-10-01T10:00:00.000Z',
  resumeMarkdown: '# Currículo\nExperiência em dados.',
};

function okResponse(overrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({ history: [RESUME_ITEM], total: 1, totalPages: 1, ...overrides }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(okResponse());
  vi.stubGlobal('fetch', fetchMock);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  downloadAdaptedResumeMock.mockResolvedValue(undefined);
  downloadAdaptedResumeDocxMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GeneratedResumesTab', () => {
  it('should_show_loading_state_while_first_request_is_pending', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resumes-loading')).toBeTruthy());
    expect(screen.getByText(/CARREGANDO CURRÍCULOS GERADOS/)).toBeTruthy();
  });

  it('should_show_error_state_and_retry', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resumes-error')).toBeTruthy());
    expect(screen.getByText('Erro ao carregar histórico')).toBeTruthy();

    fetchMock.mockResolvedValueOnce(okResponse());
    fireEvent.click(screen.getByTestId('generated-resumes-retry-button'));
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
  });

  it('should_show_connection_error_message_when_fetch_rejects', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Falha na rede'));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByText('Falha na rede')).toBeTruthy());
  });

  it('should_show_fallback_error_message_when_non_error_thrown', async () => {
    fetchMock.mockRejectedValueOnce('string error');
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByText('Erro de conexão.')).toBeTruthy());
  });

  it('should_show_empty_state_when_no_history', async () => {
    fetchMock.mockResolvedValue(okResponse({ history: [], total: 0, totalPages: 1 }));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resumes-empty')).toBeTruthy());
    expect(screen.getByText('Nenhum currículo confeccionado ainda')).toBeTruthy();
  });

  it('should_render_resume_cards_with_title_company_location_and_date', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    expect(screen.getByText('Analista de Dados')).toBeTruthy();
    expect(screen.getByText('ACME')).toBeTruthy();
    expect(screen.getByText('São Paulo')).toBeTruthy();
    expect(screen.getByText(/Gerado em/)).toBeTruthy();
  });

  it('should_not_render_company_or_location_when_empty', async () => {
    fetchMock.mockResolvedValue(
      okResponse({
        history: [{ ...RESUME_ITEM, jobCompany: '', jobLocation: '' }],
      }),
    );
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    expect(screen.queryByText('ACME')).toBeNull();
    expect(screen.queryByText('São Paulo')).toBeNull();
  });

  it('should_render_singular_heading_when_total_is_one', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() =>
      expect(screen.getByText('1 CURRÍCULO ADAPTADO DISPONÍVEL')).toBeTruthy(),
    );
  });

  it('should_render_plural_heading_when_total_is_many', async () => {
    fetchMock.mockResolvedValue(okResponse({ history: [RESUME_ITEM, RESUME_ITEM], total: 2 }));
    render(<GeneratedResumesTab />);
    await waitFor(() =>
      expect(screen.getByText('2 CURRÍCULOS ADAPTADOS DISPONÍVEIS')).toBeTruthy(),
    );
  });

  it('should_show_pagination_and_load_page_on_click', async () => {
    fetchMock.mockResolvedValue(okResponse({ history: [RESUME_ITEM], total: 11, totalPages: 2 }));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resumes-pagination')).toBeTruthy());

    fireEvent.click(within(screen.getByTestId('generated-resumes-pagination')).getByText('2'));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/resume/history?page=2&pageSize=10'),
    );
  });

  it('should_not_show_pagination_when_only_one_page', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    expect(screen.queryByTestId('generated-resumes-pagination')).toBeNull();
  });

  it('should_download_pdf_and_show_success_snackbar', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-download-pdf-button'));
    await waitFor(() => expect(screen.getByText('PDF baixado com sucesso!')).toBeTruthy());
    expect(downloadAdaptedResumeMock).toHaveBeenCalledWith({
      title: 'Analista de Dados',
      company: 'ACME',
      location: 'São Paulo',
    });
  });

  it('should_download_docx_and_show_success_snackbar', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-download-docx-button'));
    await waitFor(() =>
      expect(screen.getByText('Arquivo Word (DOCX) baixado com sucesso!')).toBeTruthy(),
    );
    expect(downloadAdaptedResumeDocxMock).toHaveBeenCalled();
  });

  it('should_show_download_error_message_on_failure', async () => {
    downloadAdaptedResumeMock.mockRejectedValueOnce(new Error('Falha ao gerar PDF'));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-download-pdf-button'));
    await waitFor(() => expect(screen.getByText('Falha ao gerar PDF')).toBeTruthy());
  });

  it('should_show_generic_download_error_when_rejected_without_message', async () => {
    downloadAdaptedResumeDocxMock.mockRejectedValueOnce(undefined);
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-download-docx-button'));
    await waitFor(() => expect(screen.getByText('Erro ao baixar DOCX.')).toBeTruthy());
  });

  it('should_block_concurrent_downloads_while_one_is_pending', async () => {
    downloadAdaptedResumeMock.mockReturnValue(new Promise(() => {}));
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());

    fireEvent.click(screen.getByTestId('resume-download-pdf-button'));
    await waitFor(() => expect(screen.getByText('BAIXANDO...')).toBeTruthy());

    fireEvent.click(screen.getByTestId('resume-download-docx-button'));
    expect(downloadAdaptedResumeDocx).not.toHaveBeenCalled();
  });

  it('should_copy_markdown_to_clipboard_and_show_snackbar', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-copy-button'));
    await waitFor(() =>
      expect(screen.getByText('Texto do currículo copiado para a área de transferência!')).toBeTruthy(),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESUME_ITEM.resumeMarkdown);
  });

  it('should_open_preview_dialog_with_markdown', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-preview-button'));
    await waitFor(() => expect(screen.getByTestId('resume-preview-dialog')).toBeTruthy());
    expect(screen.getByText(/Experiência em dados/)).toBeTruthy();
    expect(screen.getByText(/CURRÍCULO ADAPTADO: Analista de Dados/)).toBeTruthy();
  });

  it('should_close_preview_dialog', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-preview-button'));
    await waitFor(() => expect(screen.getByTestId('resume-preview-dialog')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-preview-close-button'));
    await waitFor(() => expect(screen.queryByTestId('resume-preview-dialog')).toBeNull());
  });

  it('should_copy_text_from_preview_dialog', async () => {
    render(<GeneratedResumesTab />);
    await waitFor(() => expect(screen.getByTestId('generated-resume-card')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-preview-button'));
    await waitFor(() => expect(screen.getByTestId('resume-preview-dialog')).toBeTruthy());
    fireEvent.click(screen.getByTestId('resume-preview-copy-button'));
    await waitFor(() =>
      expect(screen.getByText('Texto do currículo copiado para a área de transferência!')).toBeTruthy(),
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESUME_ITEM.resumeMarkdown);
  });
});