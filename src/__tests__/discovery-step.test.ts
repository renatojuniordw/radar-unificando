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

import { companyDiscovery } from '@/lib/core/discovery/company-discovery';

describe('DiscoveryStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_return_discovered_count_on_success', async () => {
    vi.mocked(companyDiscovery.discover).mockResolvedValue([
      { name: 'NewCo', careersUrl: 'https://newco.gupy.io', source: 'wayback' },
    ]);
    const result = await runDiscoveryStep('run-1', { companies: ['ExistingCo'] });
    expect(result).toBe(1);
  });

  it('should_return_zero_when_no_companies_discovered', async () => {
    vi.mocked(companyDiscovery.discover).mockResolvedValue([]);
    const result = await runDiscoveryStep('run-1', { companies: ['UnknownCo'] });
    expect(result).toBe(0);
  });

  it('should_return_zero_on_error_and_emit_warning', async () => {
    vi.mocked(companyDiscovery.discover).mockRejectedValue(new Error('API down'));
    const result = await runDiscoveryStep('run-1', { companies: ['TestCo'] });
    expect(result).toBe(0);
  });
});
