import type { CandidateProfile, JobRequirements, MatchResult, ScoreBreakdown } from './types';

const WEIGHTS = {
  mandatorySkills: 0.30,
  desirableSkills: 0.15,
  responsibilities: 0.15,
  seniority: 0.10,
  domain: 0.10,
  education: 0.05,
  languages: 0.05,
  logistics: 0.05,
  behavioral: 0.05,
};

export class ScoringEngine {
  calculate(profile: CandidateProfile, requirements: JobRequirements): MatchResult {
    const breakdown: ScoreBreakdown = {
      mandatorySkills: this.calcSkillMatch(profile.skills, requirements.mandatorySkills, true),
      desirableSkills: this.calcSkillMatch(profile.skills, requirements.desirableSkills, false),
      responsibilities: this.calcTextMatch(profile.skills, requirements.responsibilities),
      seniority: this.calcSeniorityMatch(profile.seniority, requirements.seniority),
      domain: this.calcTextMatch(profile.skills, [requirements.domain]),
      education: this.calcListMatch(profile.education, requirements.education),
      languages: this.calcListMatch(profile.languages, requirements.languages),
      logistics: this.calcLogisticsMatch(profile.location, requirements.location, profile.remotePreferred, requirements.remote),
      behavioral: { score: 1, weight: WEIGHTS.behavioral },
    };

    const totalScore = this.calcTotal(breakdown);

    const matchedSkills = requirements.mandatorySkills.filter(s =>
      profile.skills.some(ps => ps.toLowerCase().includes(s.toLowerCase()))
    );

    const missingMandatory = requirements.mandatorySkills.filter(s =>
      !profile.skills.some(ps => ps.toLowerCase().includes(s.toLowerCase()))
    );

    const evidence: string[] = [];
    if (matchedSkills.length > 0) evidence.push(`Match em ${matchedSkills.length}/${requirements.mandatorySkills.length} skills obrigatórias`);
    if (missingMandatory.length > 0) evidence.push(`Faltam: ${missingMandatory.slice(0, 3).join(', ')}`);
    evidence.push(`Score total: ${Math.round(totalScore * 100)}%`);

    return { totalScore, breakdown, matchedSkills, missingMandatory, evidence };
  }

  private calcSkillMatch(profile: string[], required: string[], isMandatory: boolean): { score: number; weight: number } {
    if (required.length === 0) return { score: 1, weight: isMandatory ? WEIGHTS.mandatorySkills : WEIGHTS.desirableSkills };

    const matched = required.filter(req =>
      profile.some(p => p.toLowerCase().includes(req.toLowerCase()))
    );

    return {
      score: matched.length / required.length,
      weight: isMandatory ? WEIGHTS.mandatorySkills : WEIGHTS.desirableSkills,
    };
  }

  private calcTextMatch(profile: string[], texts: string[]): { score: number; weight: number } {
    if (texts.length === 0) return { score: 1, weight: 0.15 };

    const profileText = profile.join(' ').toLowerCase();
    const matched = texts.filter(t =>
      t.toLowerCase().split(' ').some(word => profileText.includes(word.toLowerCase()))
    );

    return { score: matched.length / texts.length, weight: 0.15 };
  }

  private calcSeniorityMatch(profile: string, required: string): { score: number; weight: number } {
    const levels = ['junior', 'pleno', 'senior', 'lead', 'manager', 'head', 'director'];
    const pIdx = levels.indexOf(profile.toLowerCase());
    const rIdx = levels.indexOf(required.toLowerCase());

    if (pIdx === -1 || rIdx === -1) return { score: 0.5, weight: WEIGHTS.seniority };

    const diff = Math.abs(pIdx - rIdx);
    const score = Math.max(0, 1 - diff * 0.25);

    return { score, weight: WEIGHTS.seniority };
  }

  private calcListMatch(profile: string[], required: string[]): { score: number; weight: number } {
    if (required.length === 0) return { score: 1, weight: 0.05 };

    const matched = required.filter(r =>
      profile.some(p => p.toLowerCase().includes(r.toLowerCase()))
    );

    return { score: matched.length / required.length, weight: 0.05 };
  }

  private calcLogisticsMatch(
    profileLoc: string, requiredLoc: string,
    profileRemote: boolean, requiredRemote: boolean
  ): { score: number; weight: number } {
    let score = 1;
    if (requiredRemote && !profileRemote) score -= 0.3;
    if (requiredLoc && profileLoc && !profileLoc.toLowerCase().includes(requiredLoc.toLowerCase())) score -= 0.3;
    return { score: Math.max(0, score), weight: WEIGHTS.logistics };
  }

  private calcTotal(breakdown: ScoreBreakdown): number {
    const entries = Object.entries(breakdown) as [string, { score: number; weight: number }][];
    const total = entries.reduce((sum, [_, v]) => sum + v.score * v.weight, 0);
    const totalWeight = entries.reduce((sum, [_, v]) => sum + v.weight, 0);
    return totalWeight > 0 ? total / totalWeight : 0;
  }
}

export const scoringEngine = new ScoringEngine();
