import { z } from 'zod';

export const resumeExtractionSchema = z.object({
  markdown: z.string(),
  skills: z.array(z.string()),
  experienceYears: z.number().nullable(),
  seniority: z.enum(['junior', 'pleno', 'senior', 'lead', 'manager', 'head']).nullable(),
  education: z.array(z.string()),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;
