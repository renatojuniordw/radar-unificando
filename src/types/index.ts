export interface JobData {
  empresa: string;
  plataforma: Platform;
  na_lista: 'Sim' | 'Não';
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

export interface CompanyPresence {
  empresa: string;
  tem_gupy: string;
  pagina_gupy: string;
  tem_inhire: string;
  pagina_inhire: string;
  total_vagas_inhire: number;
}

export interface NewCompany {
  nome: string;
  total_vagas: number;
  url_carreiras: string;
}

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'interrupted';

export interface PipelineRun {
  id: string;
  status: RunStatus;
  started_at: string;
  finished_at?: string;
  total_jobs: number;
  gupy_jobs: number;
  inhire_jobs: number;
  new_companies_found: number;
  discovery_enabled: boolean;
  log: string;
}

export interface PipelineStats {
  total_jobs?: number;
  gupy_jobs?: number;
  inhire_jobs?: number;
  new_companies_found?: number;
}

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
