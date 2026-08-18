// Fixtures e helpers compartilhados pelos testes de tools de IA
// (src/__tests__/ai-tools-*.test.ts). Não é um arquivo de teste.

export const PROFILE = {
  resumeMarkdown: 'Currículo com experiência em desenvolvimento por mais de trinta caracteres.',
  resumeText: null,
  skills: ['JavaScript'],
  education: ['Engenharia'],
  experienceYears: 5,
  seniority: 'pleno',
  currentRole: 'Desenvolvedor',
  area: 'Tecnologia',
  profileSource: 'manual',
};

export const JOB_ANALYSIS = {
  matchedSkills: ['Python'],
  missingSkills: ['Kubernetes'],
  experienceFit: 'aligned',
  experienceNotes: 'ok',
  seniorityFit: 'aligned',
  educationFit: 'aligned',
  overallFit: 'high',
  summary: 'bom fit',
  recommendations: ['adicionar kubernetes'],
};

export const ATS_RESULT = {
  heuristics: { checks: ['contato presente'], score: 80 },
  analysis: {
    score: 80,
    summary: 'bom currículo',
    strengths: ['experiência clara'],
    missingKeywords: ['AWS'],
    formattingIssues: ['sem seções'],
    recommendations: ['adicionar AWS'],
  },
  cached: false,
};

export type Tool = {
  inputSchema: { safeParse: (v: unknown) => { success: boolean } };
  execute: (args?: any) => Promise<any>;
};

type ParsableSchema = { safeParse: (v: unknown) => { success: boolean } };

// O tipo do SDK `ai` expõe inputSchema como FlexibleSchema (sem safeParse no tipo);
// o runtime tem safeParse — cast necessário para validar as regras de schema.
export function schemaOf(tool: { inputSchema: unknown }): ParsableSchema {
  return tool.inputSchema as ParsableSchema;
}