import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runDiscoveryStep } from '@/lib/core/pipeline/steps/discovery-step';

vi.mock('@/lib/core/discovery/company-discovery', () => ({
  companyDiscovery: {
    discover: vi.fn(),
  },
}));

vi.mock('@/lib/core/pipeline/progress-emitter', () => ({
  progressEmitter: {
    emit: vi.fn(),
  },
}));

vi.mock('@/lib/infrastructure/repositories', () => ({
  newCompanyRepository: {
    create: vi.fn(),
    findExisting: vi.fn(),
  },
}));

import { companyDiscovery } from '@/lib/core/discovery/company-discovery';
import { newCompanyRepository } from '@/lib/infrastructure/repositories';

describe('DiscoveryStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_persist_and_count_discovered_companies', async () => {
    vi.mocked(companyDiscovery.discover).mockResolvedValue([
      { name: 'NewCo', careersUrl: 'https://newco.gupy.io', source: 'wayback' },
      { name: 'AnotherCo', careersUrl: 'https://another.jobs.com', source: 'urlscan' },
    ]);
    vi.mocked(newCompanyRepository.findExisting).mockResolvedValue(new Set());
    const result = await runDiscoveryStep('run-1', { companies: ['ExistingCo'], userId: 'user-1' });
    expect(result).toBe(2);
    expect(newCompanyRepository.create).toHaveBeenCalledTimes(2);
    expect(newCompanyRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'NewCo',
      careersUrl: 'https://newco.gupy.io',
    });
  });

  it('should_skip_already_registered_companies', async () => {
    vi.mocked(companyDiscovery.discover).mockResolvedValue([
      { name: 'NewCo', careersUrl: 'https://newco.gupy.io', source: 'wayback' },
      { name: 'KnownCo', careersUrl: 'https://known.jobs.com', source: 'urlscan' },
    ]);
    vi.mocked(newCompanyRepository.findExisting).mockResolvedValue(new Set(['KnownCo']));
    const result = await runDiscoveryStep('run-1', { companies: ['KnownCo'], userId: 'user-1' });
    expect(result).toBe(1);
    expect(newCompanyRepository.create).toHaveBeenCalledTimes(1);
    expect(newCompanyRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'NewCo' }));
  });

  it('should_return_zero_when_no_companies_discovered_without_persisting', async () => {
    vi.mocked(companyDiscovery.discover).mockResolvedValue([]);
    const result = await runDiscoveryStep('run-1', { companies: ['UnknownCo'], userId: 'user-1' });
    expect(result).toBe(0);
    expect(newCompanyRepository.findExisting).not.toHaveBeenCalled();
    expect(newCompanyRepository.create).not.toHaveBeenCalled();
  });

  it('should_return_zero_on_error_and_emit_warning', async () => {
    vi.mocked(companyDiscovery.discover).mockRejectedValue(new Error('API down'));
    const result = await runDiscoveryStep('run-1', { companies: ['TestCo'], userId: 'user-1' });
    expect(result).toBe(0);
    expect(newCompanyRepository.create).not.toHaveBeenCalled();
  });
});
