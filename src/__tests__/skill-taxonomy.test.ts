import { describe, it, expect } from 'vitest';
import { findMatchingSkills } from '@/lib/core/matching/skill-taxonomy';

describe('SkillTaxonomy', () => {
  it('should_return_empty_array_for_empty_text', () => {
    expect(findMatchingSkills('')).toEqual([]);
  });

  it('should_return_only_exact_matches_not_substrings_of_unrelated_words', () => {
    const result = findMatchingSkills('I enjoy cooking and cycling');
    expect(result).not.toContain('python');
    expect(result).not.toContain('aws');
  });

  it('should_find_single_skill_in_text', () => {
    const result = findMatchingSkills('I know python');
    expect(result).toContain('python');
  });

  it('should_find_multi_word_skill', () => {
    const result = findMatchingSkills('experienced with power bi');
    expect(result).toContain('power bi');
  });

  it('should_find_multiple_skills_across_categories', () => {
    const result = findMatchingSkills('python, sql, aws, machine learning');
    expect(result).toContain('python');
    expect(result).toContain('sql');
    expect(result).toContain('aws');
    expect(result).toContain('machine learning');
  });

  it('should_not_duplicate_skills', () => {
    const result = findMatchingSkills('python and more python');
    const pythonCount = result.filter(s => s === 'python').length;
    expect(pythonCount).toBe(1);
  });

  it('should_be_case_insensitive', () => {
    const result = findMatchingSkills('PYTHON SQL Machine Learning');
    expect(result).toContain('python');
    expect(result).toContain('sql');
    expect(result).toContain('machine learning');
  });

  it('should_match_skills_from_all_taxonomy_categories', () => {
    const categories = [
      'sql', 'python', 'power bi', 'aws', 'airflow',
      'machine learning', 'google analytics', 'product management',
      'communication', 'fintech',
    ];
    const result = findMatchingSkills(categories.join(', '));
    for (const skill of categories) {
      expect(result).toContain(skill);
    }
  });

  it('should_handle_partial_word_overlap_safely', () => {
    const result = findMatchingSkills('aws is great for cloud computing');
    expect(result).toContain('aws');
  });

  it('should_handle_portuguese_text_with_skills', () => {
    const result = findMatchingSkills('Tenho experiência em python, sql e power bi');
    expect(result).toContain('python');
    expect(result).toContain('sql');
    expect(result).toContain('power bi');
  });

  it('should_find_skills_in_long_complex_resume_text', () => {
    const resume = `
      Senior Data Analyst with 5+ years of experience.
      Proficient in Python, SQL, and Power BI.
      Worked with AWS (S3, Lambda) and Airflow for data pipelines.
      Experience with machine learning models and A/B testing.
    `;
    const result = findMatchingSkills(resume);
    expect(result).toContain('python');
    expect(result).toContain('sql');
    expect(result).toContain('power bi');
    expect(result).toContain('aws');
    expect(result).toContain('airflow');
    expect(result).toContain('machine learning');
    expect(result).toContain('lambda');
  });
});
