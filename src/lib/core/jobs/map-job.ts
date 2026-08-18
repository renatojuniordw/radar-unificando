import type { Job as PrismaJob } from '@prisma/client';
import type { Job } from '@/lib/types/job';

export function mapJobToApi(j: PrismaJob, score?: number): Job & { _score?: number } {
  return {
    id: j.id,
    company: j.company,
    platform: j.platform as Job['platform'],
    onList: (j.onList as Job['onList']) || 'Não',
    roleCategory: j.roleCategory || '',
    title: j.title || '',
    type: j.type || '',
    location: j.location || '',
    link: j.link,
    companyNameOnPlatform: j.companyNameOnPlatform || '',
    postedAt: j.postedAt || '',
    alert: j.alert || '',
    detectedAt: j.detectedAt || '',
    description: j.description || undefined,
    ...(score !== undefined ? { _score: score } : {}),
  };
}
