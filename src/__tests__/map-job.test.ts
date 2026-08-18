import { describe, it, expect } from 'vitest';
import { mapJobToApi } from '@/lib/core/jobs/map-job';

const PRISMA_JOB = {
  id: 'job-1',
  company: 'iFood',
  platform: 'Gupy',
  onList: 'Não',
  roleCategory: 'Tecnologia',
  title: 'Product Designer',
  type: 'hybrid',
  location: 'SP',
  link: 'https://gupy.io/job/1',
  companyNameOnPlatform: 'iFood',
  postedAt: '2026-08-01',
  alert: '',
  detectedAt: '2026-08-02',
  description: 'Descrição da vaga',
} as any;

describe('mapJobToApi', () => {
  it('should_map_all_fields_with_score', () => {
    expect(mapJobToApi(PRISMA_JOB, 0.85)).toEqual({
      id: 'job-1',
      company: 'iFood',
      platform: 'Gupy',
      onList: 'Não',
      roleCategory: 'Tecnologia',
      title: 'Product Designer',
      type: 'hybrid',
      location: 'SP',
      link: 'https://gupy.io/job/1',
      companyNameOnPlatform: 'iFood',
      postedAt: '2026-08-01',
      alert: '',
      detectedAt: '2026-08-02',
      description: 'Descrição da vaga',
      _score: 0.85,
    });
  });

  it('should_omit_score_when_not_provided', () => {
    const result = mapJobToApi(PRISMA_JOB);
    expect(result).not.toHaveProperty('_score');
  });

  it('should_default_nullable_fields', () => {
    const result = mapJobToApi({
      id: 'job-2',
      company: 'CorpA',
      platform: 'InHire',
      onList: null,
      roleCategory: null,
      title: null,
      type: null,
      location: null,
      link: 'https://inhire.io/2',
      companyNameOnPlatform: null,
      postedAt: null,
      alert: null,
      detectedAt: null,
      description: null,
    } as any);
    expect(result).toEqual({
      id: 'job-2',
      company: 'CorpA',
      platform: 'InHire',
      onList: 'Não',
      roleCategory: '',
      title: '',
      type: '',
      location: '',
      link: 'https://inhire.io/2',
      companyNameOnPlatform: '',
      postedAt: '',
      alert: '',
      detectedAt: '',
      description: undefined,
    });
  });

  it('should_keep_description_as_undefined_when_missing', () => {
    const result = mapJobToApi({ ...PRISMA_JOB, description: null });
    expect('description' in result).toBe(true);
    expect(result.description).toBeUndefined();
  });
});