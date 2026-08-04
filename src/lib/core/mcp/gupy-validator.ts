export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FIELDS = ['empresa', 'titulo_vaga', 'link'] as const;

export function validateGupyJob(job: Record<string, unknown>, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!job[field] || String(job[field]).trim() === '') {
      errors.push(`Job[${index}]: campo '${field}' está vazio ou ausente`);
    }
  }

  if (job.titulo_vaga && String(job.titulo_vaga).length > 200) {
    warnings.push(`Job[${index}]: título muito longo (${String(job.titulo_vaga).length} caracteres)`);
  }

  if (job.link && !String(job.link).startsWith('http')) {
    warnings.push(`Job[${index}]: link inválido (${job.link})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateGupyResponse(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    return { valid: false, errors: ['Resposta vazia'], warnings: [] };
  }

  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Resposta não é um array'], warnings: [] };
  }

  if (data.length === 0) {
    warnings.push('Nenhuma vaga encontrada');
    return { valid: true, errors, warnings };
  }

  for (let i = 0; i < data.length; i++) {
    const result = validateGupyJob(data[i] as Record<string, unknown>, i);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateInHireJob(job: Record<string, unknown>, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!job.displayName || String(job.displayName).trim() === '') {
    errors.push(`Job[${index}]: displayName vazio ou ausente`);
  }

  if (!job.jobId) {
    errors.push(`Job[${index}]: jobId ausente`);
  }

  if (job.status && String(job.status).toLowerCase() !== 'published') {
    warnings.push(`Job[${index}]: status não é published (${job.status})`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateInHirePage(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Resposta inválida'], warnings: [] };
  }

  const page = data as Record<string, unknown>;

  if (!page.tenantName) {
    errors.push('tenantName ausente');
  }

  const jobsPage = page.jobsPage;
  if (!Array.isArray(jobsPage)) {
    errors.push('jobsPage não é um array');
    return { valid: errors.length === 0, errors, warnings };
  }

  if (jobsPage.length === 0) {
    warnings.push('Nenhuma vaga publicada');
    return { valid: true, errors, warnings };
  }

  for (let i = 0; i < jobsPage.length; i++) {
    const result = validateInHireJob(jobsPage[i] as Record<string, unknown>, i);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}
