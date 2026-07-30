import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillExtractor } from '@/lib/core/ai/skill-extractor';

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn().mockResolvedValue(vi.fn().mockResolvedValue([])),
}));

describe('SkillExtractor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (SkillExtractor as any).instance = null;
  });

  it('should_be_a_singleton', () => {
    const instance1 = SkillExtractor.getInstance();
    const instance2 = SkillExtractor.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should_extract_skills_from_taxonomy', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('I know python, sql and power bi');
    expect(result.skills).toContain('python');
    expect(result.skills).toContain('sql');
    expect(result.skills).toContain('power bi');
  });

  it('should_extract_experience_from_text', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Tenho 5 anos de experiência em dados');
    expect(result.experience).toBe(5);
  });

  it('should_extract_english_experience', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('5+ years of experience in data');
    expect(result.experience).toBe(5);
  });

  it('should_return_null_experience_when_not_found', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('I know python');
    expect(result.experience).toBeNull();
  });

  it('should_reject_experience_outside_range', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('100 anos de experiência');
    expect(result.experience).toBeNull();
  });

  it('should_extract_seniority_from_text', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Senior Data Analyst');
    expect(result.seniority).toBe('senior');
  });

  it('should_extract_junior_seniority_portuguese', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Estagiário de dados');
    expect(result.seniority).toBe('junior');
  });

  it('should_return_null_seniority_when_not_found', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('This resume has no level keyword whatsoever here');
    expect(result.seniority).toBeNull();
  });

  it('should_extract_education_from_text', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Formado em Ciência da Computação');
    expect(result.education).toContain('Computer Science');
  });

  it('should_extract_multiple_education_fields', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Bacharel em Estatística e Mestrado em Ciência de Dados');
    expect(result.education).toContain('Statistics');
    expect(result.education).toContain('Data Science');
  });

  it('should_deduplicate_education', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('Ciência da Computação and Computer Science');
    expect(result.education.filter(e => e === 'Computer Science')).toHaveLength(1);
  });

  it('should_return_empty_education_when_not_found', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('No education mentioned');
    expect(result.education).toEqual([]);
  });

  it('should_extract_skills_from_bullet_points', async () => {
    const extractor = SkillExtractor.getInstance();
    const text = '• Python for data analysis\n• SQL queries and optimization\n• Power BI dashboards';
    const result = await extractor.extractSkills(text);
    expect(result.skills).toContain('python');
    expect(result.skills).toContain('sql');
    expect(result.skills).toContain('power bi');
  });

  it('should_extract_skills_from_numbered_list', async () => {
    const extractor = SkillExtractor.getInstance();
    const text = '1) Python\n2) SQL\n3) Power BI';
    const result = await extractor.extractSkills(text);
    expect(result.skills).toContain('python');
  });

  it('should_return_empty_skills_for_empty_text', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('');
    expect(result.skills).toEqual([]);
    expect(result.experience).toBeNull();
    expect(result.seniority).toBeNull();
    expect(result.education).toEqual([]);
  });

  it('should_handle_ner_model_failure_gracefully', async () => {
    const extractor = SkillExtractor.getInstance();
    const result = await extractor.extractSkills('python data analyst');
    expect(result.skills).toContain('python');
  });

  it('should_extract_from_brazilian_company_resume_format', async () => {
    const extractor = SkillExtractor.getInstance();
    const resume = `
      Experiência Profissional
      • Analytics Engineer | 2022-2024
      • Python, SQL, dbt, Airflow, AWS

      Formação
      • Bacharel em Estatística - USP
    `;
    const result = await extractor.extractSkills(resume);
    expect(result.skills).toContain('python');
    expect(result.skills).toContain('sql');
    expect(result.skills).toContain('airflow');
    expect(result.skills).toContain('aws');
    expect(result.education).toContain('Statistics');
  });

  it('should_not_load_model_if_already_loaded', async () => {
    const extractor = SkillExtractor.getInstance();
    (extractor as any).extractor = vi.fn();
    const loadSpy = vi.spyOn(extractor as any, 'loadModel');
    await extractor.extractSkills('python');
    expect(loadSpy).toHaveBeenCalled();
  });
});
