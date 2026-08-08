import { describe, it, expect } from 'vitest';
import { parseJobCards } from '@/components/chat/job-card-parser';

describe('parseJobCards', () => {
  it('deve_parsear_formato_documentado_com_blank_entre_vagas_preservando_prosa', () => {
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

  it('deve_parsear_bloco_com_quebras_de_linha_simples_sem_linhas_em_branco', () => {
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

  it('deve_parse_metadata_fora_de_ordem', () => {
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

  it('deve_omitir_date_quando_linha_calendario_ausente', () => {
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

  it('deve_tratar_header_sem_empresa', () => {
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

  it('deve_preservar_titulo_hifenizado_ao_separar_empresa', () => {
    const text = '🏢 **Front-end** — Acme\n🔗 https://acme.gupy.io/jobs/5';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Front-end', company: 'Acme', link: 'https://acme.gupy.io/jobs/5' },
    });
  });

  it('deve_capturar_descricao_multilinha_com_quebra_de_paragrafo', () => {
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

  it('deve_capturar_variantes_de_rotulo_de_descricao_sem_vazar_o_rotulo', () => {
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

  it('nao_deve_capturar_prosa_sem_rotulo_apos_o_link', () => {
    const text = '🏢 **Dev** — Acme\n🔗 https://acme.gupy.io/jobs/8\nProsa solta sem rótulo.';

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/8' },
    });
    expect(segments[1]).toEqual({ type: 'markdown', text: 'Prosa solta sem rótulo.' });
  });

  it('deve_intercalar_varias_vagas_com_prosa_entre_elas', () => {
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

  it('deve_retornar_segmento_markdown_unico_quando_nao_ha_vaga', () => {
    const text = 'Apenas um texto sem vagas.';

    const segments = parseJobCards(text);

    expect(segments).toEqual([{ type: 'markdown', text: 'Apenas um texto sem vagas.' }]);
  });

  it('deve_fazer_fallback_para_markdown_em_bloco_ambiguo_sem_link_ou_local', () => {
    const text = '🏢 **Dev** — Acme\nAlguma prosa sobre o projeto.';

    const segments = parseJobCards(text);

    expect(segments).toEqual([{ type: 'markdown', text: '🏢 **Dev** — Acme\nAlguma prosa sobre o projeto.' }]);
  });

  it('deve_extrair_url_de_link_markdown_e_ignorar_link_malformado', () => {
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

  it('deve_detectar_header_com_variation_selector', () => {
    const text = '🏢️ **Dev** — Acme\n🔗 https://acme.gupy.io/jobs/10';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/10' },
    });
  });

  it('deve_ignorar_placeholder_de_data', () => {
    const text = '🏢 **Dev** — Acme\n📅 Publicada em [data]\n🔗 https://acme.gupy.io/jobs/11';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'job',
      job: { title: 'Dev', company: 'Acme', link: 'https://acme.gupy.io/jobs/11' },
    });
  });
});