import type { Platform, JobData, ProgressEvent } from '@/types';

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E; recoverable: boolean };

export interface ScrapeParams {
  companies: string[];
  onProgress: (event: ProgressEvent) => void;
}

export interface ScrapeResult {
  platform: Platform;
  jobs: JobData[];
}

export interface IScraper {
  readonly platform: Platform;
  scrape(params: ScrapeParams): Promise<Result<ScrapeResult>>;
}

export interface SlugVariantGenerator {
  generate(name: string): string[];
}

export interface TenantProbeResult {
  slug: string;
  tenantName: string;
  jobsCount: number;
  jobs: Array<{
    jobId: string;
    displayName: string;
    workplaceType: string;
    location: string;
    status: string;
  }>;
  listCompany: string | null;
}
