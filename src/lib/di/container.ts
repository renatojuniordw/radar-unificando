import { initDb, closeDb } from '@/lib/infrastructure/db/connection';
import { runMigrations } from '@/lib/infrastructure/db/migrations';
import { JobRepository, CompanyRepository, PresenceRepository, NewCompanyRepository, RunRepository } from '@/lib/infrastructure/repositories';
import { GupyScraper } from '@/lib/core/scrapers/gupy-scraper';
import { GupyPresenceScraper } from '@/lib/core/scrapers/gupy-presence';
import { InhireGuessScraper } from '@/lib/core/scrapers/inhire-guess';
import { InhireScraper } from '@/lib/core/scrapers/inhire-scraper';
import { InhireDiscovery } from '@/lib/core/scrapers/inhire-discovery';
import { RoleMatcher } from '@/lib/core/matching/role-matcher';
import { CompanyMatcher } from '@/lib/core/matching/company-matcher';
import { TextUtils } from '@/lib/core/matching/text-utils';
import { JobDeduper } from '@/lib/core/dedup/job-deduper';
import { PipelineOrchestrator } from '@/lib/core/pipeline/orchestrator';
import { progressEmitter } from '@/lib/core/pipeline/progress-emitter';
import { ScrapeGupyStep } from '@/lib/core/pipeline/steps/scrape-gupy';
import { ScrapeInhireGuessStep } from '@/lib/core/pipeline/steps/scrape-inhire-guess';
import { DiscoverTenantsStep } from '@/lib/core/pipeline/steps/discover-tenants';
import { ValidateTenantsStep } from '@/lib/core/pipeline/steps/validate-tenants';
import { ScrapeInhireAllStep } from '@/lib/core/pipeline/steps/scrape-inhire-all';
import { MergeJobsStep } from '@/lib/core/pipeline/steps/merge-jobs';
import { BuildPresenceStep } from '@/lib/core/pipeline/steps/build-presence';

import type { IJobRepository, ICompanyRepository, IPresenceRepository, INewCompanyRepository, IRunRepository } from '@/lib/infrastructure/repositories/types';

export interface Container {
  jobRepo: IJobRepository;
  companyRepo: ICompanyRepository;
  presenceRepo: IPresenceRepository;
  newCompanyRepo: INewCompanyRepository;
  runRepo: IRunRepository;
  orchestrator: PipelineOrchestrator;
  progressEmitter: typeof progressEmitter;
  roleMatcher: RoleMatcher;
  companyMatcher: CompanyMatcher;
}

let globalContainer: Container | null = null;

export function getContainer(dbPath?: string): Container {
  if (globalContainer) return globalContainer;

  const db = initDb(dbPath);
  runMigrations(db);

  const textUtils = new TextUtils();
  const roleMatcher = new RoleMatcher();
  const companyMatcher = new CompanyMatcher(textUtils);

  const jobRepo: IJobRepository = new JobRepository(db);
  const companyRepo: ICompanyRepository = new CompanyRepository(db);
  const presenceRepo: IPresenceRepository = new PresenceRepository(db);
  const newCompanyRepo: INewCompanyRepository = new NewCompanyRepository(db);
  const runRepo: IRunRepository = new RunRepository(db);

  const gupyScraper = new GupyScraper(roleMatcher, companyMatcher);
  const gupyPresence = new GupyPresenceScraper(companyMatcher);
  const inhireGuess = new InhireGuessScraper(roleMatcher, companyMatcher);
  const inhireScraper = new InhireScraper(roleMatcher, companyMatcher);
  const inhireDiscovery = new InhireDiscovery();

  const deduper = new JobDeduper();

  const pipelineSteps = [
    new ScrapeGupyStep(gupyScraper, jobRepo),
    new ScrapeInhireGuessStep(inhireGuess, jobRepo),
    new DiscoverTenantsStep(inhireDiscovery),
    new ValidateTenantsStep(inhireScraper),
    new ScrapeInhireAllStep(inhireScraper, jobRepo, newCompanyRepo),
    new MergeJobsStep(jobRepo, deduper),
    new BuildPresenceStep(gupyPresence, presenceRepo, jobRepo),
  ];

  const orchestrator = new PipelineOrchestrator(pipelineSteps, runRepo, progressEmitter);

  globalContainer = {
    jobRepo,
    companyRepo,
    presenceRepo,
    newCompanyRepo,
    runRepo,
    orchestrator,
    progressEmitter,
    roleMatcher,
    companyMatcher,
  };

  return globalContainer;
}

export function resetContainer(): void {
  closeDb();
  globalContainer = null;
}
