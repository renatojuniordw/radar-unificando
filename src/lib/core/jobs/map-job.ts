import type { Job as PrismaJob } from '@prisma/client';
import type { Job, Platform } from '@/lib/types/job';

const PLATFORMS: readonly Platform[] = ['Gupy', 'InHire'];
const ON_LIST: readonly NonNullable<Job['onList']>[] = ['Sim', 'Não'];

export function mapJobToApi(j: PrismaJob, score?: number): Job & { _score?: number } {
  return {
    id: j.id,
    company: j.company,
    // Valores fora do union (dados legados/inconsistentes) caem no fallback seguro.
    platform: PLATFORMS.includes(j.platform as Platform) ? (j.platform as Platform) : 'Gupy',
    onList: ON_LIST.includes(j.onList as NonNullable<Job['onList']>) ? (j.onList as Job['onList']) : 'Não',
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
