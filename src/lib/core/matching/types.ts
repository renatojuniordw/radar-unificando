export interface CandidateProfile {
  skills: string[];
  experienceYears: number;
  seniority: string;
  education: string[];
  languages: string[];
  domain: string;
  location: string;
  remotePreferred: boolean;
}

export interface JobRequirements {
  mandatorySkills: string[];
  desirableSkills: string[];
  responsibilities: string[];
  seniority: string;
  domain: string;
  education: string[];
  languages: string[];
  location: string;
  remote: boolean;
}

export interface ScoreBreakdown {
  mandatorySkills: { score: number; weight: number };
  desirableSkills: { score: number; weight: number };
  responsibilities: { score: number; weight: number };
  seniority: { score: number; weight: number };
  domain: { score: number; weight: number };
  education: { score: number; weight: number };
  languages: { score: number; weight: number };
  logistics: { score: number; weight: number };
  behavioral: { score: number; weight: number };
}

export interface MatchResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingMandatory: string[];
  evidence: string[];
}
