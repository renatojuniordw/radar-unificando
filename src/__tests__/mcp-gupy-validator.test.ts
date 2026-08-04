import { describe, it, expect } from 'vitest';
import {
  validateGupyResponse,
  validateGupyJob,
  validateInHirePage,
  validateInHireJob,
} from '@/lib/core/mcp/gupy-validator';

describe('validateGupyResponse', () => {
  it('should reject null response', () => {
    const result = validateGupyResponse(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Resposta vazia');
  });

  it('should reject non-array response', () => {
    const result = validateGupyResponse({ foo: 'bar' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Resposta não é um array');
  });

  it('should warn on empty array', () => {
    const result = validateGupyResponse([]);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Nenhuma vaga encontrada');
  });

  it('should accept valid job list', () => {
    const result = validateGupyResponse([
      { empresa: 'Nubank', titulo_vaga: 'Data Analyst', link: 'https://gupy.io/job/123' },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject job missing required fields', () => {
    const result = validateGupyResponse([
      { empresa: 'Nubank', titulo_vaga: '' },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('titulo_vaga'))).toBe(true);
    expect(result.errors.some(e => e.includes('link'))).toBe(true);
  });

  it('should warn on invalid link', () => {
    const result = validateGupyResponse([
      { empresa: 'Nubank', titulo_vaga: 'Data Analyst', link: 'not-a-url' },
    ]);
    expect(result.warnings.some(w => w.includes('link inválido'))).toBe(true);
  });
});

describe('validateGupyJob', () => {
  it('should accept valid job', () => {
    const result = validateGupyJob(
      { empresa: 'Nubank', titulo_vaga: 'Data Analyst', link: 'https://gupy.io/job/123' },
      0,
    );
    expect(result.valid).toBe(true);
  });

  it('should reject job without empresa', () => {
    const result = validateGupyJob(
      { titulo_vaga: 'Data Analyst', link: 'https://gupy.io/job/123' },
      0,
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('empresa');
  });
});

describe('validateInHirePage', () => {
  it('should reject null response', () => {
    const result = validateInHirePage(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Resposta inválida');
  });

  it('should reject page without tenantName', () => {
    const result = validateInHirePage({ jobsPage: [] });
    expect(result.errors).toContain('tenantName ausente');
  });

  it('should reject page without jobsPage array', () => {
    const result = validateInHirePage({ tenantName: 'Corp' });
    expect(result.errors).toContain('jobsPage não é um array');
  });

  it('should accept valid page', () => {
    const result = validateInHirePage({
      tenantName: 'Corp',
      jobsPage: [
        { displayName: 'Data Analyst', jobId: '123', status: 'published' },
      ],
    });
    expect(result.valid).toBe(true);
  });

  it('should warn on unpublished jobs', () => {
    const result = validateInHirePage({
      tenantName: 'Corp',
      jobsPage: [
        { displayName: 'Data Analyst', jobId: '123', status: 'draft' },
      ],
    });
    expect(result.warnings.some(w => w.includes('não é published'))).toBe(true);
  });
});

describe('validateInHireJob', () => {
  it('should reject job without displayName', () => {
    const result = validateInHireJob({ jobId: '123', status: 'published' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('displayName');
  });

  it('should reject job without jobId', () => {
    const result = validateInHireJob({ displayName: 'Data Analyst', status: 'published' }, 0);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('jobId');
  });
});
