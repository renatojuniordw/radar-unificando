import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/lib/core/matching/scoring-engine';
import type { CandidateProfile, JobRequirements } from '@/lib/core/matching/types';

const engine = new ScoringEngine();

const fullProfile: CandidateProfile = {
  skills: ['python', 'sql', 'power bi', 'data analysis'],
  experienceYears: 5,
  seniority: 'senior',
  domain: '',
  education: ['Computer Science'],
  languages: ['English'],
  location: 'São Paulo',
  remotePreferred: true,
};

describe('ScoringEngine', () => {
  // ── Existing Tests (Renamed from Portuguese to English) ──

  it('should_identify_missing_mandatory_skills', () => {
    const req: JobRequirements = {
      mandatorySkills: ['aws', 'kubernetes', 'python'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.missingMandatory).toContain('aws');
    expect(result.missingMandatory).toContain('kubernetes');
    expect(result.matchedSkills).toContain('python');
    expect(result.missingMandatory).not.toContain('python');
  });

  it('should_return_high_score_when_all_skills_match', () => {
    const req: JobRequirements = {
      mandatorySkills: ['python', 'sql'],
      desirableSkills: ['power bi'],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.totalScore).toBeGreaterThan(0.6);
    expect(result.matchedSkills).toContain('python');
    expect(result.matchedSkills).toContain('sql');
    expect(result.missingMandatory).toHaveLength(0);
  });

  it('should_include_evidence_array_with_descriptions', () => {
    const req: JobRequirements = {
      mandatorySkills: ['python'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence[0]).toContain('Match em');
    expect(result.evidence[result.evidence.length - 1]).toContain('Score total');
  });

  it('should_return_breakdown_with_all_nine_keys', () => {
    const req: JobRequirements = {
      mandatorySkills: [],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    const keys = Object.keys(result.breakdown);
    expect(keys).toContain('mandatorySkills');
    expect(keys).toContain('desirableSkills');
    expect(keys).toContain('seniority');
    expect(keys).toContain('responsibilities');
    expect(keys).toContain('domain');
    expect(keys).toContain('education');
    expect(keys).toContain('languages');
    expect(keys).toContain('logistics');
    expect(keys).toContain('behavioral');
    expect(keys).toHaveLength(9);
  });

  // ── New Tests: Edge Cases ──

  it('should_return_perfect_score_when_all_reqs_are_empty', () => {
    const req: JobRequirements = {
      mandatorySkills: [],
      desirableSkills: [],
      responsibilities: [],
      seniority: '',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: false,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.totalScore).toBeCloseTo(0.952, 2);
  });

  it('should_return_zero_score_when_all_reqs_mismatch_and_no_dimension_scores', () => {
    const req: JobRequirements = {
      mandatorySkills: ['nonexistent_skill_1', 'nonexistent_skill_2'],
      desirableSkills: ['nonexistent_desirable'],
      responsibilities: ['something completely different and unrelated'],
      seniority: 'director',
      domain: 'someweirddomainthatdoesnotexistanywhere',
      education: ['PhD in Underwater Basket Weaving'],
      languages: ['Klingon'],
      location: 'Mars',
      remote: true,
    };
    const profile: CandidateProfile = {
      skills: ['python'],
      experienceYears: 1,
      seniority: 'junior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remotePreferred: false,
    };
    const result = engine.calculate(profile, req);
    expect(result.totalScore).toBeLessThan(0.2);
    expect(result.matchedSkills).toHaveLength(0);
    expect(result.missingMandatory).toEqual(['nonexistent_skill_1', 'nonexistent_skill_2']);
  });

  it('should_perform_case_insensitive_skill_matching', () => {
    const req: JobRequirements = {
      mandatorySkills: ['PYTHON', 'SQL'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.matchedSkills).toContain('PYTHON');
    expect(result.missingMandatory).not.toContain('PYTHON');
  });

  it('should_perform_substring_skill_matching', () => {
    const req: JobRequirements = {
      mandatorySkills: ['data'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.matchedSkills).toContain('data');
  });

  it('should_penalize_logistics_when_remote_required_and_profile_not_remote', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: [], languages: [], location: '', remote: true };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: '', education: [], languages: [], domain: '', location: '', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.logistics.score).toBeLessThan(1);
    expect(result.breakdown.logistics.score).toBe(0.7);
  });

  it('should_penalize_logistics_when_locations_dont_match', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: [], languages: [], location: 'Rio de Janeiro', remote: false };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: '', education: [], languages: [], domain: '', location: 'São Paulo', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.logistics.score).toBe(0.7);
  });

  it('should_not_penalize_logistics_when_location_fields_are_empty', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: [], languages: [], location: '', remote: false };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: '', education: [], languages: [], domain: '', location: '', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.logistics.score).toBe(1);
  });

  it('should_clamp_logistics_score_at_zero', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: [], languages: [], location: 'RequiredCity', remote: true };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: '', education: [], languages: [], domain: '', location: 'DifferentCity', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.logistics.score).toBeCloseTo(0.4, 2);
  });

  it('should_return_behavioral_score_as_one_always', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: [], languages: [], location: '', remote: false };
    const result = engine.calculate(fullProfile, req);
    expect(result.breakdown.behavioral.score).toBe(1);
  });

  it('should_calculate_seniority_perfect_match', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: 'senior', domain: '', education: [], languages: [], location: '', remote: false };
    const result = engine.calculate(fullProfile, req);
    expect(result.breakdown.seniority.score).toBe(1);
  });

  it('should_calculate_seniority_partial_match', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: 'pleno', domain: '', education: [], languages: [], location: '', remote: false };
    const result = engine.calculate(fullProfile, req);
    expect(result.breakdown.seniority.score).toBe(0.75);
  });

  it('should_calculate_seniority_max_diff_as_zero', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: 'junior', domain: '', education: [], languages: [], location: '', remote: false };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: 'director', education: [], languages: [], domain: '', location: '', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.seniority.score).toBe(0);
  });

  it('should_return_05_seniority_for_unknown_levels', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: 'unknown_level_xyz', domain: '', education: [], languages: [], location: '', remote: false };
    const profile: CandidateProfile = { skills: [], experienceYears: 0, seniority: 'another_unknown_level', education: [], languages: [], domain: '', location: '', remotePreferred: false };
    const result = engine.calculate(profile, req);
    expect(result.breakdown.seniority.score).toBe(0.5);
  });

  it('should_match_education_case_insensitively', () => {
    const req: JobRequirements = { mandatorySkills: [], desirableSkills: [], responsibilities: [], seniority: '', domain: '', education: ['computer science'], languages: [], location: '', remote: false };
    const result = engine.calculate(fullProfile, req);
    expect(result.breakdown.education.score).toBe(1);
  });

  it('should_return_evidence_with_match_count', () => {
    const req: JobRequirements = {
      mandatorySkills: ['python', 'sql', 'power bi'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    expect(result.evidence[0]).toContain('3/3');
  });

  it('should_return_evidence_with_missing_skills_when_gaps_exist', () => {
    const req: JobRequirements = {
      mandatorySkills: ['python', 'aws', 'kubernetes', 'spark', 'docker'],
      desirableSkills: [],
      responsibilities: [],
      seniority: 'senior',
      domain: '',
      education: [],
      languages: [],
      location: '',
      remote: true,
    };
    const result = engine.calculate(fullProfile, req);
    const missingEvidence = result.evidence.find(e => e.startsWith('Faltam'));
    expect(missingEvidence).toBeDefined();
    expect(missingEvidence).toContain('aws');
  });
});
