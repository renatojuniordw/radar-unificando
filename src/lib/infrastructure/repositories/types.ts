import type { JobData, CompanyPresence, NewCompany, PipelineRun, RunStatus, Platform, PipelineStats } from '@/types';

export interface IJobRepository {
  upsertJobs(jobs: JobData[]): Promise<number>;
  findAll(filters?: JobFilters): Promise<JobData[]>;
  replaceAll(jobs: JobData[]): Promise<void>;
  stampDetectionDates(today: string): Promise<void>;
  getStats(): Promise<{ total: number; gupy: number; inhire: number }>;
  getInhireTenantsForCompanies(companies: string[]): Promise<Array<{ empresa: string; slug: string; vagas: number }>>;
}

export interface JobFilters {
  plataforma?: Platform;
  empresa?: string;
  cargo_categoria?: string;
  na_lista?: 'Sim' | 'Não';
  search?: string;
}

export interface ICompanyRepository {
  setList(names: string[]): Promise<void>;
  findAll(): Promise<string[]>;
  add(name: string): Promise<void>;
  remove(name: string): Promise<void>;
}

export interface IPresenceRepository {
  buildPresence(
    companies: string[],
    gupyEntries: Array<{ empresa: string; url: string }>,
    inhireTenants: Array<{ empresa: string; slug: string; vagas: number }>
  ): Promise<void>;
  findAll(): Promise<CompanyPresence[]>;
}

export interface INewCompanyRepository {
  replaceAll(companies: NewCompany[]): Promise<void>;
  findAll(): Promise<NewCompany[]>;
}

export interface IRunRepository {
  create(id: string, discoveryEnabled: boolean): Promise<void>;
  update(id: string, data: Partial<PipelineRun>): Promise<void>;
  findById(id: string): Promise<PipelineRun | null>;
  findLatest(): Promise<PipelineRun | null>;
}
