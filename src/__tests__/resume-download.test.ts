// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { jobKey, downloadAdaptedResume } from '@/lib/client/resume-download';

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

  it('should_throw_when_fetch_fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(
      downloadAdaptedResume({ title: 'Dev', company: 'ACME' }),
    ).rejects.toThrow('network down');
  });
});