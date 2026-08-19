import { describe, it, expect } from 'vitest';
import { parseJobCards } from '@/components/chat/job-card-parser';

describe('parseJobCards', () => {
  it('should_parse_documented_format_with_blank_lines_preserving_prose', () => {
    const text = [
      'Encontrei estas vagas:',
      '',
      '🏢 **Integration Software Engineer** — Nubank',
      '📍 São Paulo | Remoto',
      '📅 Publicada em 05/08/2026',
      '🔗 https://nubank.gupy.io/jobs/123',
      '',
      '🏢 **DevOps Engineer** — Stone',
      '📍 Rio de Janeiro | Híbrido',
      '🔗 https://stone.gupy.io/jobs/456',
      '',
      'Quer que eu analise alguma?',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(4);
    expect(segments[0]).toEqual({ type: 'markdown', text: 'Encontrei estas vagas:' });
    expect(segments[1]).toEqual({
      type: 'job',
      job: {
        title: 'Integration Software Engineer',
        company: 'Nubank',
        location: 'São Paulo',
        modality: 'Remoto',
        date: '05/08/2026',
        link: 'https://nubank.gupy.io/jobs/123',
      },
    });
    expect(segments[2]).toEqual({
      type: 'job',
      job: {
        title: 'DevOps Engineer',
        company: 'Stone',
        location: 'Rio de Janeiro',
        modality: 'Híbrido',
        link: 'https://stone.gupy.io/jobs/456',
      },
    });
    expect(segments[3]).toEqual({ type: 'markdown', text: 'Quer que eu analise alguma?' });
  });

  it('should_parse_block_with_single_line_breaks', () => {
    const text = [
      '🏢 **Front-end Engineer** — Acme',
      '📍 São Paulo | Remoto',
      '📅 Publicada em 01/08/2026',
      '🔗 https://acme.gupy.io/jobs/1',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      type: 'job',
      job: {
        title: 'Front-end Engineer',
        company: 'Acme',
        location: 'São Paulo',
        modality: 'Remoto',
        date: '01/08/2026',
        link: 'https://acme.gupy.io/jobs/1',
      },
    });
  });

  it('should_parse_metadata_out_of_order', () => {
    const text = [
      '🏢 **Dev** — Acme',
      '🔗 https://acme.gupy.io/jobs/2',
      '📍 São Paulo | Presencial',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: {
        title: 'Dev',
        company: 'Acme',
        location: 'São Paulo',
        modality: 'Presencial',
        link: 'https://acme.gupy.io/jobs/2',
      },
    });
  });

  it('should_omit_date_when_calendar_line_missing', () => {
    const text = '🏢 **Dev** — Acme\n📍 São Paulo | Remoto\n🔗 https://acme.gupy.io/jobs/3';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: {
        title: 'Dev',
        company: 'Acme',
        location: 'São Paulo',
        modality: 'Remoto',
        link: 'https://acme.gupy.io/jobs/3',
      },
    });
  });

  it('should_handle_header_without_company', () => {
    const text = '🏢 **Backend Developer**\n📍 São Paulo | Remoto\n🔗 https://acme.gupy.io/jobs/4';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: {
        title: 'Backend Developer',
        location: 'São Paulo',
        modality: 'Remoto',
        link: 'https://acme.gupy.io/jobs/4',
      },
    });
  });

  it('should_preserve_hyphenated_title_when_splitting_company', () => {
    const text = '🏢 **Front-end** — Acme\n🔗 https://acme.gupy.io/jobs/5';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Front-end', company: 'Acme', link: 'https://acme.gupy.io/jobs/5' },
    });
  });

  it('should_capture_multiline_description_with_paragraph_break', () => {
    const text = [
      '🏢 **Dev** — Acme',
      '📍 São Paulo | Remoto',
      '🔗 https://acme.gupy.io/jobs/6',
      '**Descrição:** Primeira frase da vaga.',
      '',
      'Segunda frase em novo parágrafo.',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: {
        title: 'Dev',
        company: 'Acme',
        location: 'São Paulo',
        modality: 'Remoto',
        link: 'https://acme.gupy.io/jobs/6',
        description: 'Primeira frase da vaga.\n\nSegunda frase em novo parágrafo.',
      },
    });
  });

  it('should_capture_description_label_variants_without_leaking_label', () => {
    const variants = ['Descrição:', '**Descrição:**', '**Descrição**'];

    for (const label of variants) {
      const text = `🏢 **Dev** — Acme\n🔗 https://acme.gupy.io/jobs/7\n${label} texto da descrição`;
      const segments = parseJobCards(text);
      expect(segments[0]).toEqual({
        type: 'job',
        job: {
          title: 'Dev',
          company: 'Acme',
          link: 'https://acme.gupy.io/jobs/7',
          description: 'texto da descrição',
        },
      });
    }
  });

  it('should_not_capture_unlabeled_prose_after_link', () => {
    const text = '🏢 **Dev** — Acme\n🔗 https://acme.gupy.io/jobs/8\nProsa solta sem rótulo.';

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/8' },
    });
    expect(segments[1]).toEqual({ type: 'markdown', text: 'Prosa solta sem rótulo.' });
  });

  it('should_interleave_multiple_jobs_with_prose', () => {
    const text = [
      '🏢 **A** — Co',
      '🔗 https://a.gupy.io/jobs/1',
      '',
      'Comentário entre as vagas.',
      '',
      '🏢 **B** — Co',
      '🔗 https://b.gupy.io/jobs/2',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'job', job: { title: 'A', company: 'Co', link: 'https://a.gupy.io/jobs/1' } });
    expect(segments[1]).toEqual({ type: 'markdown', text: 'Comentário entre as vagas.' });
    expect(segments[2]).toEqual({ type: 'job', job: { title: 'B', company: 'Co', link: 'https://b.gupy.io/jobs/2' } });
  });

  it('should_return_single_markdown_segment_when_no_jobs', () => {
    const text = 'Apenas um texto sem vagas.';

    const segments = parseJobCards(text);

    expect(segments).toEqual([{ type: 'markdown', text: 'Apenas um texto sem vagas.' }]);
  });

  it('should_fall_back_to_markdown_for_ambiguous_block', () => {
    const text = '🏢 **Dev** — Acme\nAlguma prosa sobre o projeto.';

    const segments = parseJobCards(text);

    expect(segments).toEqual([{ type: 'markdown', text: '🏢 **Dev** — Acme\nAlguma prosa sobre o projeto.' }]);
  });

  it('should_extract_url_from_markdown_link_and_ignore_malformed', () => {
    const mdLink = '🏢 **Dev** — Acme\n🔗 [Ver Vaga](https://acme.gupy.io/jobs/9)';
    expect(parseJobCards(mdLink)[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/9' },
    });

    // Sem URL válida e sem local, o bloco é ambíguo e cai no fallback de markdown.
    const malformed = '🏢 **Dev** — Acme\n🔗 sem-url-aqui';
    expect(parseJobCards(malformed)).toEqual([
      { type: 'markdown', text: '🏢 **Dev** — Acme\n🔗 sem-url-aqui' },
    ]);
  });

  it('should_detect_header_with_variation_selector', () => {
    const text = '🏢️ **Dev** — Acme\n🔗 https://acme.gupy.io/jobs/10';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/10' },
    });
  });

  it('should_ignore_date_placeholder', () => {
    const text = '🏢 **Dev** — Acme\n📅 Publicada em [data]\n🔗 https://acme.gupy.io/jobs/11';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/11' },
    });
  });

  it('should_split_company_with_spaced_hyphen', () => {
    const text = '🏢 **Front-end** - **Nubank**\n🔗 https://nubank.gupy.io/jobs/12';
    const segments = parseJobCards(text);
    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Front-end', company: 'Nubank', link: 'https://nubank.gupy.io/jobs/12' },
    });
  });

  it('should_parse_course_card_with_metadata', () => {
    const text = [
      '📚 **Curso de Python** — Udemy',
      '📌 Skill: python',
      '💰 R$ 29,90',
      '🔗 https://udemy.com/course/python',
    ].join('\n');
    const segments = parseJobCards(text);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      type: 'course',
      course: {
        title: 'Curso de Python',
        provider: 'Udemy',
        skill: 'python',
        price: 'R$ 29,90',
        link: 'https://udemy.com/course/python',
      },
    });
  });

  it('should_parse_course_card_without_provider_or_skill', () => {
    const text = '📚 **Curso Avulso**\n💰 R$ 19,90\n🔗 https://udemy.com/course/x';
    const segments = parseJobCards(text);
    expect(segments[0]).toEqual({
      type: 'course',
      course: { title: 'Curso Avulso', price: 'R$ 19,90', link: 'https://udemy.com/course/x' },
    });
  });
});