import { describe, it, expect } from 'vitest';
import { renderResumePdf } from '@/lib/pdf/render-resume-pdf';

describe('renderResumePdf', () => {
  it('should_render_valid_pdf_buffer', async () => {
    const resume = {
      fullName: 'Maria Silva',
      headline: 'Desenvolvedora | React | TypeScript',
      contact: { email: 'maria@email.com', phone: '11999999999', location: 'São Paulo', linkedin: '' },
      summary: 'Desenvolvedora com 5 anos de experiência em React e TypeScript.',
      skills: ['React', 'TypeScript'],
      experience: [
        { role: 'Desenvolvedora', company: 'Empresa X', period: '2021-2024', bullets: ['Aumentei conversão em 30%'] },
      ],
      education: [{ degree: 'Ciência da Computação', institution: 'USP', period: '2015-2019' }],
      certifications: [{ name: 'AWS Certified', issuer: 'Amazon', year: '2023' }],
      languages: [{ language: 'Inglês', level: 'Avançado' }],
    };

    const buffer = await renderResumePdf(resume as any);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});