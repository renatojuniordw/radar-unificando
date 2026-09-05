// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JobPostingSchema, type JobPostingData } from '@/components/seo/job-posting-schema';

// Um payload hostil que tenta escapar do bloco <script type="application/ld+json">
// (stored XSS clássico de "script tag breakout"): título/descrição de vaga vêm de
// scraping externo (Gupy/InHire) e não são confiáveis.
const MALICIOUS_JOB = {
  title: 'Dev</script><script>window.__pwned=1</script>',
  company: 'Acme & Sons',
  location: 'Remote <img src=x onerror=alert(1)>',
  type: 'FULL_TIME',
  url: 'https://example.com/job',
  description: 'Vaga <b>especial</b> com payload',
};

const MINIMAL_JOB: JobPostingData = {
  title: 'Analista de Dados',
  company: 'TechCorp',
  location: 'São Paulo',
  type: 'presencial',
  url: 'https://example.com/vaga-analista',
};

describe('JobPostingSchema', () => {
  it('should_not_break_out_of_json_ld_script_tag_with_malicious_job_data', () => {
    const { container } = render(<JobPostingSchema jobs={[MALICIOUS_JOB]} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const html = script!.innerHTML;

    // Nenhuma tag `<script>` fechada prematuramente pode existir no conteúdo.
    expect(html).not.toContain('</script>');
    expect(html).not.toContain('<script>');
    // `<`/`>`/`&` devem vir escapados como \uXXXX (JSON válido, HTML inofensivo).
    expect(html).toContain('\\u003c/script\\u003e');
    expect(html).toContain('\\u0026');
    // E o JSON resultante continua válido (dado é preservado, só escapado).
    const parsed = JSON.parse(html);
    expect(parsed.title).toBe(MALICIOUS_JOB.title);
    expect(parsed.hiringOrganization.name).toBe(MALICIOUS_JOB.company);
  });

  it('should render nothing when jobs is undefined', () => {
    const { container } = render(
      <JobPostingSchema jobs={undefined as unknown as JobPostingData[]} />
    );
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('should render nothing when jobs is an empty array', () => {
    const { container } = render(<JobPostingSchema jobs={[]} />);
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it('should render one script per job', () => {
    const { container } = render(
      <JobPostingSchema jobs={[MINIMAL_JOB, { ...MINIMAL_JOB, title: 'Dev' }]} />
    );
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(2);
  });

  it('should render at most ten job postings', () => {
    const manyJobs = Array.from({ length: 12 }, (_, i) => ({
      ...MINIMAL_JOB,
      title: `Vaga ${i + 1}`,
    }));
    const { container } = render(<JobPostingSchema jobs={manyJobs} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(10);
    const first = JSON.parse(scripts[0].innerHTML || '{}');
    expect(first.title).toBe('Vaga 1');
  });

  it('should have @type JobPosting and correct @context for each schema', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content['@type']).toBe('JobPosting');
    expect(content['@context']).toBe('https://schema.org');
  });

  it('should use the provided description when present', () => {
    const job = { ...MINIMAL_JOB, description: 'Descrição oficial da vaga.' };
    const { container } = render(<JobPostingSchema jobs={[job]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.description).toBe('Descrição oficial da vaga.');
  });

  it('should build a fallback description when description is missing', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.description).toBe(
      `Vaga de ${MINIMAL_JOB.title} na empresa ${MINIMAL_JOB.company} via plataforma ${MINIMAL_JOB.location}.`
    );
  });

  it('should use Gupy/InHire in the fallback description when location is missing', () => {
    const job: JobPostingData = {
      title: 'Dev',
      company: 'Acme',
      location: '',
      type: 'remoto',
      url: 'https://example.com/dev',
    };
    const { container } = render(<JobPostingSchema jobs={[job]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.description).toBe(
      'Vaga de Dev na empresa Acme via plataforma Gupy/InHire.'
    );
  });

  it('should use the provided datePosted when present', () => {
    const job = { ...MINIMAL_JOB, datePosted: '2026-09-01' };
    const { container } = render(<JobPostingSchema jobs={[job]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.datePosted).toBe('2026-09-01');
  });

  it('should fallback datePosted to the current timestamp when missing', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    const posted = Date.parse(content.datePosted);
    expect(Number.isNaN(posted)).toBe(false);
    // nowIso é avaliado uma vez no carregamento do módulo; tolerância folgada.
    expect(Math.abs(posted - Date.now())).toBeLessThan(60_000);
  });

  it('should set validThrough about 30 days after datePosted', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    const diffMs = Date.parse(content.validThrough) - Date.parse(content.datePosted);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(diffMs - thirtyDaysMs)).toBeLessThan(60_000);
  });

  it('should set employmentType to FULL_TIME by default', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.employmentType).toBe('FULL_TIME');
  });

  it('should set hiringOrganization with company name and job url as sameAs', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.hiringOrganization['@type']).toBe('Organization');
    expect(content.hiringOrganization.name).toBe(MINIMAL_JOB.company);
    expect(content.hiringOrganization.sameAs).toBe(MINIMAL_JOB.url);
  });

  it('should set jobLocation with Brazil country and the provided locality', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.jobLocation['@type']).toBe('Place');
    expect(content.jobLocation.address['@type']).toBe('PostalAddress');
    expect(content.jobLocation.address.addressCountry).toBe('BR');
    expect(content.jobLocation.address.addressLocality).toBe(MINIMAL_JOB.location);
  });

  it('should fallback addressLocality to Brasil when location is missing', () => {
    const job: JobPostingData = {
      title: 'Dev',
      company: 'Acme',
      location: '',
      type: 'remoto',
      url: 'https://example.com/dev',
    };
    const { container } = render(<JobPostingSchema jobs={[job]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.jobLocation.address.addressLocality).toBe('Brasil');
  });

  it('should set applicantLocationRequirements to Brazil', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.applicantLocationRequirements['@type']).toBe('Country');
    expect(content.applicantLocationRequirements.name).toBe('BR');
  });

  it('should set jobLocationType to TELECOMMUTE when type contains remoto (case-insensitive)', () => {
    const job = { ...MINIMAL_JOB, type: 'Remoto Híbrido' };
    const { container } = render(<JobPostingSchema jobs={[job]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.jobLocationType).toBe('TELECOMMUTE');
  });

  it('should omit jobLocationType when type is not remote', () => {
    const nonRemoteJobs: JobPostingData[] = [
      { ...MINIMAL_JOB, type: 'Híbrido' },
      { ...MINIMAL_JOB, type: 'presencial' },
    ];
    for (const job of nonRemoteJobs) {
      const { container } = render(<JobPostingSchema jobs={[job]} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      const content = JSON.parse(script?.innerHTML || '{}');
      expect(content.jobLocationType).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(content, 'jobLocationType')).toBe(false);
    }
  });

  it('should set directApply to true', () => {
    const { container } = render(<JobPostingSchema jobs={[MINIMAL_JOB]} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const content = JSON.parse(script?.innerHTML || '{}');
    expect(content.directApply).toBe(true);
  });
});