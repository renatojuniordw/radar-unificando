import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '@/lib/core/matching/scoring-engine';
import type { CandidateProfile, JobRequirements } from '@/lib/core/matching/types';

const engine = new ScoringEngine();

const profile: CandidateProfile = {
  skills: ['python', 'sql', 'power bi', 'data analysis'],
  experienceYears: 5,
  seniority: 'senior',
  domain: '',
  education: [],
  languages: [],
  location: '',
  remotePreferred: true,
};

describe('ScoringEngine', () => {
  it('identifica skills obrigatórias faltando', () => {
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
    const result = engine.calculate(profile, req);
    expect(result.missingMandatory).toContain('aws');
    expect(result.missingMandatory).toContain('kubernetes');
    expect(result.matchedSkills).toContain('python');
  });

  it('retorna score alto quando skills batem', () => {
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
    const result = engine.calculate(profile, req);
    expect(result.totalScore).toBeGreaterThan(0.6);
    expect(result.matchedSkills).toContain('python');
  });

  it('inclui evidence array', () => {
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
    const result = engine.calculate(profile, req);
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('retorna breakdown com pesos corretos', () => {
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
    const result = engine.calculate(profile, req);
    const keys = Object.keys(result.breakdown);
    expect(keys).toContain('mandatorySkills');
    expect(keys).toContain('desirableSkills');
    expect(keys).toContain('seniority');
  });
});
