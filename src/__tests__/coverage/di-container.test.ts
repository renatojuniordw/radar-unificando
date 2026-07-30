import { describe, it, expect } from 'vitest';
import { getContainer } from '@/lib/infrastructure/di/container';

describe('DIContainer', () => {
  it('should_return_container_with_all_repositories', () => {
    const container = getContainer();
    expect(container.userRepository).toBeDefined();
    expect(container.profileRepository).toBeDefined();
    expect(container.jobRepository).toBeDefined();
    expect(container.applicationRepository).toBeDefined();
    expect(container.newCompanyRepository).toBeDefined();
    expect(container.companyPresenceRepository).toBeDefined();
    expect(container.pipelineRunRepository).toBeDefined();
  });
});
