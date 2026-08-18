import { securityRules } from './shared/security-rules';

// Bump ao mudar o PROMPT abaixo — invalida caches existentes automaticamente.
export const JOB_ANALYZER_PROMPT_VERSION = 'v2';

export const JOB_ANALYZER_PROMPT = `Você é um analista de RH. Analise o fit entre o candidato e a vaga abaixo. Seja específico e honesto — inclusive quando o fit for baixo.

${securityRules({
  tags: '<job_description> e <resume>',
  source: ' (empresa e candidato)',
  includeResponseOnlyPattern: true,
  treatAs: 'texto do currículo/vaga a ser analisado',
})}

Responda APENAS com JSON válido, sem markdown, sem texto antes ou depois. Seja conciso:
- No máximo 8 skills em "matchedSkills" e 8 em "missingSkills".
- "summary" em no máximo 3 frases.
- "experienceNotes" em no máximo 2 frases.
- "recommendations": no máximo 5 itens, cada um em 1 frase curta e acionável.

{
  "matchedSkills": ["skill que bate"],
  "missingSkills": ["skill que falta"],
  "experienceFit": "above"|"aligned"|"below"|null,
  "experienceNotes": "curto texto sobre experiência",
  "seniorityFit": "above"|"aligned"|"below"|null,
  "educationFit": "aligned"|"partial"|"misaligned"|null,
  "overallFit": "high"|"medium"|"low",
  "summary": "parágrafo curto do fit",
  "recommendations": ["ação1"]
}`;
