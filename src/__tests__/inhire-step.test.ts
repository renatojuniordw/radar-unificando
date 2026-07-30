import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInHireStep } from '@/lib/core/pipeline/steps/inhire-step';

vi.mock('@/lib/core/scrapers/inhire-scraper', () => ({
  inhireScraper: {
    searchJobs: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

import { inhireScraper } from '@/lib/core/scrapers/inhire-scraper';

describe('InHireStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_labeled_jobs_on_success', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([
      { empresa: 'CorpA', plataforma: 'InHire', na_lista: 'Não', cargo_categoria: 'Analyst', titulo_vaga: 'Data Analyst', tipo: 'Remoto', local: 'Remote', link: 'https://a.com', nome_na_plataforma: 'CorpA', publicado: '', alerta: '' } as any,
    ]);
    const result = await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] });
    expect(result).toHaveLength(1);
    expect(result[0].na_lista).toBe('Sim');
  });

  it('should_label_jobs_as_nao_when_company_not_in_list', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([
      { empresa: 'UnknownCorp', plataforma: 'InHire', na_lista: 'Não', cargo_categoria: 'Analyst', titulo_vaga: 'Data Analyst', tipo: 'Remoto', local: 'Remote', link: 'https://a.com', nome_na_plataforma: 'UnknownCorp', publicado: '', alerta: '' } as any,
    ]);
    const result = await runInHireStep('run-1', { companies: ['ListedCorp'] });
    expect(result[0].na_lista).toBe('Não');
  });

  it('should_return_empty_array_on_scraper_error', async () => {
    vi.mocked(inhireScraper.searchJobs).mockRejectedValue(new Error('API error'));
    const result = await runInHireStep('run-1', { companies: ['CorpA'] });
    expect(result).toEqual([]);
  });

  it('should_pass_companies_to_scraper', async () => {
    vi.mocked(inhireScraper.searchJobs).mockResolvedValue([]);
    await runInHireStep('run-1', { companies: ['CorpA', 'CorpB'] });
    expect(inhireScraper.searchJobs).toHaveBeenCalledWith(['CorpA', 'CorpB']);
  });
});
