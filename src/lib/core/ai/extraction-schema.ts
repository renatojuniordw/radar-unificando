import { z } from 'zod';

export const resumeExtractionSchema = z.object({
  skills: z.array(z.string()).nullable().transform((val) => val ?? []),
  experienceYears: z.number().nullable(),
  seniority: z.enum(['junior', 'pleno', 'senior', 'lead', 'manager', 'head']).nullable(),
  education: z.array(z.string()).nullable().transform((val) => val ?? []),
  currentRole: z.string().nullable(),
  area: z.string().nullable(),
  extractionError: z.string().nullable().default(null),
});

export type ResumeExtraction = z.infer<typeof resumeExtractionSchema>;
