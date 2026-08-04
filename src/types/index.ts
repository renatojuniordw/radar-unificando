export interface JobData {
  empresa: string;
  plataforma: Platform;
  na_lista?: 'Sim' | 'Não';
  cargo_categoria: string;
  titulo_vaga: string;
  tipo: string;
  local: string;
  link: string;
  nome_na_plataforma: string;
  publicado: string;
  alerta: string;
  detectado_em?: string;
  descricao?: string;
}

export type Platform = 'Gupy' | 'InHire';

export type ProgressEventType = 'step_start' | 'step_progress' | 'step_complete' | 'step_warn' | 'step_error' | 'pipeline_complete' | 'pipeline_error' | 'pipeline_cancelled';

export interface ProgressEvent {
  type: ProgressEventType;
  step?: string;
  message?: string;
  detail?: string;
  current?: number;
  total?: number;
  error?: string;
  jobs?: JobData[];
}
