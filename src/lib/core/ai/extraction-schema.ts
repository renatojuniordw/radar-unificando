import { z } from 'zod';

export const resumeExtractionSchema = z.object({
  skills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  seniority: z.enum(['junior', 'pleno', 'senior', 'lead', 'manager', 'head']).nullable(),
  education: z.array(z.string()),
  currentRole: z.string().nullable(),
  area: z.string().nullable(),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;
