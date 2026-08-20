// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { jobKey, downloadAdaptedResume, downloadAdaptedResumeDocx } from '@/lib/client/resume-download';

describe('jobKey', () => {
  it('should_compose_key_from_company_and_title', () => {
    expect(jobKey({ title: 'Dev', company: 'Nubank' })).toBe('Nubank|Dev');
  });
});

describe('downloadAdaptedResume', () => {
  const fetchMock = vi.fn();
  const createObjectUrlMock = vi.fn(() => 'blob:fake');
  const revokeObjectUrlMock = vi.fn();
  const clickMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    createObjectUrlMock.mockReset();
    revokeObjectUrlMock.mockReset();
    clickMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('atob', (b64: string) => Buffer.from(b64, 'base64').toString('binary'));
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
    document.body.innerHTML = '';
    HTMLAnchorElement.prototype.click = clickMock;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should_post_job_data_and_trigger_download', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ pdfBase64: Buffer.from('PDFDATA').toString('base64') }),
    });

    await downloadAdaptedResume({ title: 'Dev React', company: 'Nubank', description: 'Vaga', location: 'SP' });

    expect(fetchMock).toHaveBeenCalledWith('/api/resume/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
      body: JSON.stringify({
        jobTitle: 'Dev React',
        jobDescription: 'Vaga',
        jobCompany: 'Nubank',
        jobLocation: 'SP',
      }),
    });
    expect(createObjectUrlMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlMock).toHaveBeenCalled();
  });

  it('should_default_empty_description_and_location', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ pdfBase64: 'eA==' }) });
    await downloadAdaptedResume({ title: 'Dev', company: 'ACME' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.jobDescription).toBe('');
    expect(body.jobLocation).toBe('');
  });

  it('should_throw_api_error_message_when_request_fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Erro ao gerar o currículo: limite' }),
    });
    await expect(
      downloadAdaptedResume({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('Erro ao gerar o currículo: limite');
  });

  it('should_throw_default_message_when_no_error_detail', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => null });
    await expect(
      downloadAdaptedResume({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('Erro ao gerar o currículo.');
  });

  it('should_throw_connection_error_when_fetch_fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(
      downloadAdaptedResume({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('Erro de conexão. Tente novamente.');
  });

  it('should_throw_timeout_message_when_fetch_is_aborted', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    await expect(
      downloadAdaptedResume({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('A geração está demorando mais que o esperado. Tente novamente em instantes.');
  });

  it('should_call_progress_callback_with_step_updates', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ pdfBase64: 'eA==' }),
    });
    const onProgress = vi.fn();

    await downloadAdaptedResume({ title: 'Dev', company: 'ACME' }, onProgress);

    // Should have been called at least for step 1 (immediate) and step 3 (final)
    expect(onProgress).toHaveBeenCalled();
    const firstCall = onProgress.mock.calls[0][0];
    expect(firstCall.step).toBe(1);
    expect(firstCall.totalSteps).toBe(3);
    expect(firstCall.progressPercent).toBe(20);
  });

  it('should_use_pdf_extension_in_download_filename', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ pdfBase64: 'eA==' }),
    });

    // Intercept the anchor creation to capture the download name
    let capturedDownload = '';
    const origCreateElement = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        const origClick = el.click.bind(el);
        el.click = () => {
          capturedDownload = (el as HTMLAnchorElement).download;
          origClick();
        };
      }
      return el;
    }) as typeof document.createElement;

    await downloadAdaptedResume({ title: 'Dev React', company: 'Nubank' });

    document.createElement = origCreateElement;
    expect(capturedDownload).toContain('.pdf');
    expect(capturedDownload).toContain('nubank');
    expect(capturedDownload).toContain('dev-react');
  });
});

describe('downloadAdaptedResumeDocx', () => {
  const fetchMock = vi.fn();
  const createObjectUrlMock = vi.fn(() => 'blob:fake');
  const revokeObjectUrlMock = vi.fn();
  const clickMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    createObjectUrlMock.mockReset();
    revokeObjectUrlMock.mockReset();
    clickMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
    document.body.innerHTML = '';
    HTMLAnchorElement.prototype.click = clickMock;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should_post_same_payload_as_pdf_version', async () => {
    // Mock the dynamic import of render-resume-docx
    vi.doMock('@/lib/docx/render-resume-docx', () => ({
      renderResumeDocx: vi.fn().mockResolvedValue(new Blob(['docx-data'])),
    }));

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ resume: { name: 'Test' } }),
    });

    await downloadAdaptedResumeDocx({ title: 'Dev', company: 'ACME', description: 'Vaga', location: 'SP' });

    expect(fetchMock).toHaveBeenCalledWith('/api/resume/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
      body: JSON.stringify({
        jobTitle: 'Dev',
        jobDescription: 'Vaga',
        jobCompany: 'ACME',
        jobLocation: 'SP',
      }),
    });
  });

  it('should_use_docx_extension_in_download_filename', async () => {
    vi.doMock('@/lib/docx/render-resume-docx', () => ({
      renderResumeDocx: vi.fn().mockResolvedValue(new Blob(['docx-data'])),
    }));

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ resume: {} }),
    });

    let capturedDownload = '';
    const origCreateElement = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        const origClick = el.click.bind(el);
        el.click = () => {
          capturedDownload = (el as HTMLAnchorElement).download;
          origClick();
        };
      }
      return el;
    }) as typeof document.createElement;

    await downloadAdaptedResumeDocx({ title: 'Dev React', company: 'Nubank' });

    document.createElement = origCreateElement;
    expect(capturedDownload).toContain('.docx');
  });

  it('should_throw_connection_error_when_fetch_fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(
      downloadAdaptedResumeDocx({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('Erro de conexão. Tente novamente.');
  });

  it('should_throw_api_error_message_when_request_fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Erro ao gerar o currículo: limite' }),
    });
    await expect(
      downloadAdaptedResumeDocx({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('Erro ao gerar o currículo: limite');
  });
});