import type { CandidateProfile, JobRequirements, MatchResult } from './types';

export class ResumeAdapter {
  adapt(profile: CandidateProfile, requirements: JobRequirements, match: MatchResult): string {
    const sections: string[] = [];
    const isMandatoryMatch = match.missingMandatory.length === 0;

    if (!isMandatoryMatch) {
      sections.push(this.generateOpeningWithCompensation(profile, requirements, match));
    } else {
      sections.push(this.generateOpening(profile, requirements));
    }

    sections.push(this.generateSkillsSection(profile, requirements, match));
    sections.push(this.generateExperienceSection(profile, requirements));

    if (profile.education.length > 0) {
      sections.push(`**Educação:** ${profile.education.join(', ')}`);
    }

    sections.push(this.generateClosing(requirements));

    return sections.join('\n\n');
  }

  private generateOpening(profile: CandidateProfile, requirements: JobRequirements): string {
    const seniority = profile.seniority || 'profissional';
    const domain = requirements.domain || 'Dados e Analytics';

    return (
      `${seniority.charAt(0).toUpperCase() + seniority.slice(1)} de ${domain} ` +
      `com ${profile.experienceYears}+ anos de experiência em análise de dados, ` +
      `business intelligence e desenvolvimento de soluções analíticas.`
    );
  }

  private generateOpeningWithCompensation(
    profile: CandidateProfile,
    requirements: JobRequirements,
    match: MatchResult
  ): string {
    const missingStr = match.missingMandatory.slice(0, 3).join(', ');
    return (
      `${this.generateOpening(profile, requirements)}\n\n` +
      `**Nota:** Embora algumas skills específicas (${missingStr}) não estejam ` +
      `no meu dia a dia atual, tenho forte capacidade de aprendizado e ` +
      `transferência de conhecimento de tecnologias correlatas.`
    );
  }

  private generateSkillsSection(
    profile: CandidateProfile,
    requirements: JobRequirements,
    match: MatchResult
  ): string {
    const allSkills = [...new Set([...requirements.mandatorySkills, ...requirements.desirableSkills, ...profile.skills])];
    const matchedSet = new Set(match.matchedSkills);
    const grouped = allSkills.map(skill => ({
      skill,
      matched: matchedSet.has(skill),
      isProfile: profile.skills.includes(skill),
    }));

    const matched = grouped.filter(g => g.matched);
    const extra = grouped.filter(g => !g.matched && g.isProfile);

    const lines: string[] = ['**Skills Técnicas:**'];

    if (matched.length > 0) {
      lines.push(`- ${matched.map(m => m.skill).join(', ')}`);
    }
    if (extra.length > 0) {
      lines.push(`- Skills Adicionais: ${extra.map(e => e.skill).join(', ')}`);
    }

    return lines.join('\n');
  }

  private generateExperienceSection(profile: CandidateProfile, requirements: JobRequirements): string {
    return (
      `**Experiência Relevante:** ${profile.experienceYears} anos de experiência ` +
      `na área de ${requirements.domain || 'Dados'}, ` +
      `com histórico de entrega de projetos de ponta a ponta, ` +
      `desde a extração e modelagem de dados até a criação de dashboards ` +
      `e apresentação de insights para stakeholders.`
    );
  }

  private generateClosing(requirements: JobRequirements): string {
    return `Estou disponível para contribuir com minhas habilidades em ` +
      `${requirements.mandatorySkills.slice(0, 4).join(', ')} ` +
      `para gerar impacto através de análises baseadas em dados.`;
  }
}

export const resumeAdapter = new ResumeAdapter();
