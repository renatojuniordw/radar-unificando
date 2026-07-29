export const STAGES = [
  'discovered',
  'analyzed',
  'prioritized',
  'documents_pending',
  'ready_to_apply',
  'applied',
  'recruiter_contacted',
  'response_received',
  'hr_interview',
  'technical_interview',
  'manager_interview',
  'case_study',
  'final_stage',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
  'no_response',
] as const;

export type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  discovered: 'Descoberta',
  analyzed: 'Analisada',
  prioritized: 'Priorizada',
  documents_pending: 'Documentos Pendentes',
  ready_to_apply: 'Pronta para Aplicar',
  applied: 'Aplicada',
  recruiter_contacted: 'Recrutador Contactou',
  response_received: 'Resposta Recebida',
  hr_interview: 'Entrevista RH',
  technical_interview: 'Entrevista Técnica',
  manager_interview: 'Entrevista Gestor',
  case_study: 'Case Técnico',
  final_stage: 'Etapa Final',
  offer: 'Oferta',
  hired: 'Contratado',
  rejected: 'Rejeitado',
  withdrawn: 'Desistiu',
  no_response: 'Sem Resposta',
};

const STAGE_GROUPS: Record<string, Stage[]> = {
  triagem: ['discovered', 'analyzed', 'prioritized'],
  preparacao: ['documents_pending', 'ready_to_apply'],
  aplicacao: ['applied', 'recruiter_contacted', 'response_received'],
  entrevistas: ['hr_interview', 'technical_interview', 'manager_interview', 'case_study', 'final_stage'],
  resultado: ['offer', 'hired', 'rejected', 'withdrawn', 'no_response'],
};

const ALLOWED_TRANSITIONS: Record<Stage, Stage[]> = {
  discovered: ['analyzed', 'withdrawn'],
  analyzed: ['prioritized', 'discovered', 'withdrawn'],
  prioritized: ['documents_pending', 'analyzed', 'withdrawn'],
  documents_pending: ['ready_to_apply', 'prioritized', 'withdrawn'],
  ready_to_apply: ['applied', 'documents_pending', 'withdrawn'],
  applied: ['recruiter_contacted', 'response_received', 'rejected', 'withdrawn', 'no_response'],
  recruiter_contacted: ['hr_interview', 'response_received', 'rejected', 'withdrawn', 'no_response'],
  response_received: ['hr_interview', 'applied', 'rejected', 'withdrawn', 'no_response'],
  hr_interview: ['technical_interview', 'manager_interview', 'rejected', 'withdrawn', 'no_response'],
  technical_interview: ['manager_interview', 'case_study', 'hr_interview', 'rejected', 'withdrawn', 'no_response'],
  manager_interview: ['final_stage', 'technical_interview', 'rejected', 'withdrawn', 'no_response'],
  case_study: ['final_stage', 'technical_interview', 'rejected', 'withdrawn', 'no_response'],
  final_stage: ['offer', 'rejected', 'withdrawn', 'no_response'],
  offer: ['hired', 'rejected', 'withdrawn'],
  hired: [],
  rejected: ['withdrawn'],
  withdrawn: [],
  no_response: ['withdrawn'],
};

export function getStageLabel(stage: Stage): string {
  return STAGE_LABELS[stage] || stage;
}

export function getAllowedTransitions(stage: Stage): Stage[] {
  return ALLOWED_TRANSITIONS[stage] || [];
}

export function getStageGroups() {
  return STAGE_GROUPS;
}

export function canTransition(from: Stage, to: Stage): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}

export class InvalidStatusTransition extends Error {
  constructor(from: string, to: string) {
    super(`Transição inválida: ${from} → ${to}`);
    this.name = 'InvalidStatusTransition';
  }
}
