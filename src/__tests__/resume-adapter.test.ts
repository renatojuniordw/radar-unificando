import { describe, it, expect } from 'vitest';
import { ResumeAdapter } from '@/lib/core/matching/resume-adapter';
import type { CandidateProfile, JobRequirements, MatchResult } from '@/lib/core/matching/types';

const adapter = new ResumeAdapter();

const profile: CandidateProfile = {
  skills: ['python', 'sql', 'power bi', 'data analysis'],
  experienceYears: 5,
  seniority: 'senior',
  domain: '',
  education: ['Computer Science'],
  languages: [],
  location: '',
  remotePreferred: true,
};

const requirements: JobRequirements = {
  mandatorySkills: ['python', 'sql'],
  desirableSkills: ['power bi'],
  responsibilities: [],
  seniority: 'senior',
  domain: 'Data & Analytics',
  education: [],
  languages: [],
  location: '',
  remote: true,
};

const matchResult: MatchResult = {
  totalScore: 0.85,
  breakdown: {
    mandatorySkills: { score: 1, weight: 0.30 },
    desirableSkills: { score: 1, weight: 0.15 },
    responsibilities: { score: 1, weight: 0.15 },
    seniority: { score: 1, weight: 0.10 },
    domain: { score: 1, weight: 0.10 },
    education: { score: 1, weight: 0.05 },
    languages: { score: 1, weight: 0.05 },
    logistics: { score: 1, weight: 0.05 },
    behavioral: { score: 1, weight: 0.05 },
  },
  matchedSkills: ['python', 'sql'],
  missingMandatory: [],
  evidence: ['Match em 2/2 skills obrigatórias', 'Score total: 85%'],
};

const matchWithGaps: MatchResult = {
  ...matchResult,
  matchedSkills: ['python'],
  missingMandatory: ['aws', 'kubernetes'],
  evidence: ['Match em 1/3 skills obrigatórias', 'Faltam: aws, kubernetes', 'Score total: 60%'],
};

describe('ResumeAdapter', () => {
  it('should_generate_opening_with_seniority_and_domain_when_all_skills_match', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).toContain('Senior');
    expect(result).toContain('Data & Analytics');
    expect(result).toContain('5+ anos');
  });

  it('should_include_compensation_note_when_mandatory_skills_are_missing', () => {
    const result = adapter.adapt(profile, requirements, matchWithGaps);
    expect(result).toContain('não estejam no meu dia a dia');
    expect(result).toContain('aws');
  });

  it('should_not_include_compensation_note_when_all_skills_match', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).not.toContain('Não estejam no meu dia a dia');
  });

  it('should_include_skills_section_with_matched_and_extra_skills', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).toContain('Skills Técnicas');
    expect(result).toContain('python');
    expect(result).toContain('sql');
  });

  it('should_include_experience_section', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).toContain('Experiência Relevante');
    expect(result).toContain('5 anos');
  });

  it('should_include_education_section_when_profile_has_education', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).toContain('Educação');
    expect(result).toContain('Computer Science');
  });

  it('should_not_include_education_section_when_empty', () => {
    const noEduProfile: CandidateProfile = { ...profile, education: [] };
    const result = adapter.adapt(noEduProfile, requirements, matchResult);
    expect(result).not.toContain('Educação');
  });

  it('should_include_closing_with_mandatory_skills', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    expect(result).toContain('Estou disponível');
    expect(result).toContain('python');
    expect(result).toContain('sql');
  });

  it('should_use_fallback_seniority_when_empty', () => {
    const noSeniorityProfile: CandidateProfile = { ...profile, seniority: '' };
    const result = adapter.adapt(noSeniorityProfile, requirements, matchResult);
    expect(result).toContain('Profissional');
  });

  it('should_use_fallback_domain_when_empty', () => {
    const noDomainReq: JobRequirements = { ...requirements, domain: '' };
    const result = adapter.adapt(profile, noDomainReq, matchResult);
    expect(result).toContain('Dados e Analytics');
  });

  it('should_handle_empty_profile_skills_gracefully', () => {
    const emptySkillsProfile: CandidateProfile = { ...profile, skills: [] };
    const result = adapter.adapt(emptySkillsProfile, { ...requirements, mandatorySkills: ['aws', 'docker'] }, matchWithGaps);
    expect(result).toContain('Senior');
    expect(result).toBeTruthy();
  });

  it('should_return_all_four_to_five_sections', () => {
    const result = adapter.adapt(profile, requirements, matchResult);
    const sectionCount = (result.match(/\*\*/g) || []).length;
    expect(sectionCount).toBeGreaterThanOrEqual(4);
  });
});
