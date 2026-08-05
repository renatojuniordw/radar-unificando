export type Platform = 'Gupy' | 'InHire';

export interface Job {
  id?: string;
  company: string;
  platform: Platform;
  onList?: 'Sim' | 'Não';
  roleCategory: string;
  title: string;
  type: string;
  location: string;
  link: string;
  companyNameOnPlatform: string;
  postedAt: string;
  alert: string;
  detectedAt?: string;
  description?: string;
}
