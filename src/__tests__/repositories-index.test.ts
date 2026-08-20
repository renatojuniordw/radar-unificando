import { describe, it, expect } from 'vitest';
import {
  userRepository,
  profileRepository,
  jobRepository,
  publicJobRepository,
  pipelineRunRepository,
  newCompanyRepository,
  chatRepository,
  adminRepository,
} from '@/lib/infrastructure/repositories';

describe('repositories barrel exports', () => {
  it('should export userRepository', () => {
    expect(userRepository).toBeDefined();
  });

  it('should export profileRepository', () => {
    expect(profileRepository).toBeDefined();
  });

  it('should export jobRepository', () => {
    expect(jobRepository).toBeDefined();
  });

  it('should export publicJobRepository', () => {
    expect(publicJobRepository).toBeDefined();
  });

  it('should export pipelineRunRepository', () => {
    expect(pipelineRunRepository).toBeDefined();
  });

  it('should export newCompanyRepository', () => {
    expect(newCompanyRepository).toBeDefined();
  });

  it('should export chatRepository', () => {
    expect(chatRepository).toBeDefined();
  });

  it('should export adminRepository', () => {
    expect(adminRepository).toBeDefined();
  });

  it('userRepository should be an object with methods', () => {
    expect(typeof userRepository).toBe('object');
  });

  it('chatRepository should be an object with methods', () => {
    expect(typeof chatRepository).toBe('object');
  });

  it('adminRepository should be an object with methods', () => {
    expect(typeof adminRepository).toBe('object');
  });
});
