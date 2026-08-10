// Validação de entrada do pipeline (POST /api/pipeline).
import { z } from 'zod';

export const pipelineStartSchema = z.object({
  companies: z.array(z.string().trim().max(100)).max(20).default([]),
  queries: z.array(z.string().trim().max(100)).max(20).default([]),
  auto: z.boolean().optional(),
});
