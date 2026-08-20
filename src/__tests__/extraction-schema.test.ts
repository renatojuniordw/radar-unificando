import { describe, it, expect } from 'vitest';
import { resumeExtractionSchema, type ResumeExtraction } from '@/lib/core/ai/extraction-schema';

describe('resumeExtractionSchema', () => {
  const validData = {
    skills: ['React', 'TypeScript'],
    experienceYears: 5,
    seniority: 'senior' as const,
    education: ['Ciência da Computação'],
    currentRole: 'Desenvolvedor Full Stack',
    area: 'Tecnologia',
    extractionError: null,
  };

  it('should validate correct data', () => {
    const result = resumeExtractionSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual(['React', 'TypeScript']);
      expect(result.data.experienceYears).toBe(5);
      expect(result.data.seniority).toBe('senior');
      expect(result.data.education).toEqual(['Ciência da Computação']);
      expect(result.data.currentRole).toBe('Desenvolvedor Full Stack');
      expect(result.data.area).toBe('Tecnologia');
    }
  });

  it('should reject invalid seniority value', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      seniority: 'expert',
    });
    expect(result.success).toBe(false);
  });

  it('should handle null skills by transforming to empty array', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      skills: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual([]);
    }
  });

  it('should handle null education by transforming to empty array', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      education: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.education).toEqual([]);
    }
  });

  it('should handle null experienceYears', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      experienceYears: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experienceYears).toBeNull();
    }
  });

  it('should handle null seniority', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      seniority: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seniority).toBeNull();
    }
  });

  it('should default extractionError to null', () => {
    const { extractionError, ...dataWithoutError } = validData;
    const result = resumeExtractionSchema.safeParse(dataWithoutError);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extractionError).toBeNull();
    }
  });

  it('should accept all valid seniority levels', () => {
    const seniorities = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head'] as const;
    for (const seniority of seniorities) {
      const result = resumeExtractionSchema.safeParse({
        ...validData,
        seniority,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should accept empty skills and education arrays', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      skills: [],
      education: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual([]);
      expect(result.data.education).toEqual([]);
    }
  });

  it('should handle all nullable fields as null', () => {
    const result = resumeExtractionSchema.safeParse({
      skills: null,
      experienceYears: null,
      seniority: null,
      education: null,
      currentRole: null,
      area: null,
      extractionError: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.skills).toEqual([]);
      expect(result.data.experienceYears).toBeNull();
      expect(result.data.seniority).toBeNull();
      expect(result.data.education).toEqual([]);
      expect(result.data.currentRole).toBeNull();
      expect(result.data.area).toBeNull();
    }
  });

  it('should reject missing required fields', () => {
    const result = resumeExtractionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept extractionError as a string', () => {
    const result = resumeExtractionSchema.safeParse({
      ...validData,
      extractionError: 'Parse failed',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extractionError).toBe('Parse failed');
    }
  });
});
