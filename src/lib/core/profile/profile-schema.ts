// Validação de entrada da atualização de perfil (PUT /api/profile).
import { z } from 'zod';

export const profileUpdateSchema = z.object({
  skills: z.array(z.string().trim().max(100)).max(100).default([]),
  experienceYears: z.number().int().min(0).max(60).nullable().optional(),
  seniority: z.string().trim().max(50).nullable().optional(),
  currentRole: z.string().trim().max(100).nullable().optional(),
  area: z.string().trim().max(100).nullable().optional(),
  education: z.array(z.string().trim().max(200)).max(20).default([]),
  resumeText: z.string().max(50_000).nullable().optional(),
  resumeMarkdown: z.string().max(80_000).nullable().optional(),
  profileSource: z.string().trim().max(20).nullable().optional(),
});
