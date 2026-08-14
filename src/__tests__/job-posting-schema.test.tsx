// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JobPostingSchema } from '@/components/seo/job-posting-schema';

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
});
