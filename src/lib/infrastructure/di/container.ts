import {
  userRepository,
  profileRepository,
  jobRepository,
  applicationRepository,
  newCompanyRepository,
  companyPresenceRepository,
  pipelineRunRepository,
} from '@/lib/infrastructure/repositories';
import type { IUserRepository, IProfileRepository } from '@/lib/infrastructure/repositories/user-repository';
import type { IJobRepository } from '@/lib/infrastructure/repositories/job-repository';
import type { IApplicationRepository } from '@/lib/infrastructure/repositories/application-repository';
import type { INewCompanyRepository, ICompanyPresenceRepository } from '@/lib/infrastructure/repositories/company-repository';
import type { IPipelineRunRepository } from '@/lib/infrastructure/repositories/pipeline-repository';

export interface Container {
  userRepository: IUserRepository;
  profileRepository: IProfileRepository;
  jobRepository: IJobRepository;
  applicationRepository: IApplicationRepository;
  newCompanyRepository: INewCompanyRepository;
  companyPresenceRepository: ICompanyPresenceRepository;
  pipelineRunRepository: IPipelineRunRepository;
}

const container: Container = {
  userRepository,
  profileRepository,
  jobRepository,
  applicationRepository,
  newCompanyRepository,
  companyPresenceRepository,
  pipelineRunRepository,
};

export function getContainer(): Container {
  return container;
}
