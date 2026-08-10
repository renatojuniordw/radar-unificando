import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: vi.fn(),
}));

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pdfToMarkdown, textToMarkdown } from '@/lib/core/parsing/pdf-to-markdown';

interface ItemOpts {
  fontSize?: number;
  bold?: boolean;
}

function item(str: string, x = 0, y = 100, opts: ItemOpts = {}) {
  const size = opts.fontSize ?? 12;
  return {
    str,
    transform: [size, 0, 0, size, x, y],
    width: str.length * 6,
    height: 10,
    fontName: opts.bold ? 'Bold' : 'Regular',
  };
}

function mockDoc(numPages: number, pageItems: ReturnType<typeof item>[][]) {
  const getPage = vi.fn(async (n: number) => ({
    getTextContent: async () => ({ items: pageItems[n - 1] ?? [] }),
  }));
  const doc = { numPages, getPage };
  // pdfjs.getDocument() retorna um objeto task com `.promise` — mock direto, sem Promise wrapper.
  vi.mocked(getDocument).mockReturnValue({ promise: Promise.resolve(doc) } as any);
  return { doc, getPage };
}

describe('textToMarkdown', () => {
  it('converte_cabecalhos_de_secao_por_keyword', () => {
    expect(textToMarkdown('Experiência profissional')).toBe('## Experiência profissional');
    expect(textToMarkdown('HABILIDADES')).toContain('## HABILIDADES');
  });

  it('converte_linhas_all_caps_em_cabecalho', () => {
    expect(textToMarkdown('DESENVOLVEDOR')).toBe('## DESENVOLVEDOR');
  });

  it('nao_trata_texto_longo_ou_misto_como_cabecalho', () => {
    const long = 'A'.repeat(85);
    expect(textToMarkdown(long)).toBe(long);

    expect(textToMarkdown('Desenvolvedor Front-end')).toBe('Desenvolvedor Front-end');
  });

  it('converte_bullets_e_itens_numerados', () => {
    expect(textToMarkdown('• Python')).toBe('- Python');
    expect(textToMarkdown('- SQL')).toBe('- SQL');
    expect(textToMarkdown('1. Primeiro')).toBe('- Primeiro');
    expect(textToMarkdown('2) Segundo')).toBe('- Segundo');
  });

  it('normaliza_texto_e_curly_quotes', () => {
    expect(textToMarkdown('Olá   mundo')).toBe('Olá mundo');
    expect(textToMarkdown('“aspas” e ‘apostrofo’')).toBe('"aspas" e \'apostrofo\'');
  });

  it('colapsa_linhas_em_branco', () => {
    expect(textToMarkdown('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('retorna_vazio_para_input_vazio_ou_somente_brancos', () => {
    expect(textToMarkdown('')).toBe('');
    expect(textToMarkdown('   \n \n  ')).toBe('');
  });
});

describe('pdfToMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converte_conteudo_do_pdf_em_markdown_com_cabecalho_e_bullets', async () => {
    mockDoc(1, [
      [
        item('EXPERIÊNCIA', 0, 100, { bold: true }),
        item('Engenheiro de Dados', 0, 90),
        item('• Pipeline em Python', 0, 80),
        item('1. Projeto X', 0, 70),
      ],
    ]);

    const md = await pdfToMarkdown(Buffer.from('fake-pdf'));

    expect(md).toContain('## EXPERIÊNCIA');
    expect(md).toContain('Engenheiro de Dados');
    expect(md).toContain('- Pipeline em Python');
    expect(md).toContain('- Projeto X');
  });

  it('agrupa_itens_da_mesma_linha_por_posicao_y', async () => {
    mockDoc(1, [
      [
        item('João', 0, 100),
        item('Silva', 60, 100),
        item('Desenvolvedor', 0, 90),
      ],
    ]);

    const md = await pdfToMarkdown(Buffer.from('fake-pdf'));

    expect(md).toContain('João Silva');
  });

  it('trata_paginas_sem_itens', async () => {
    mockDoc(2, [[item('Texto único', 0, 100)], []]);

    const md = await pdfToMarkdown(Buffer.from('fake-pdf'));

    expect(md).toBe('Texto único');
  });

  it('retorna_vazio_quando_pdf_nao_tem_itens', async () => {
    mockDoc(1, [[]]);

    const md = await pdfToMarkdown(Buffer.from('fake-pdf'));

    expect(md).toBe('');
  });

  it('limita_a_20_paginas_processadas', async () => {
    const pages = Array.from({ length: 25 }, () => [item('linha', 0, 100)]);
    const { getPage } = mockDoc(25, pages);

    await pdfToMarkdown(Buffer.from('fake-pdf'));

    expect(getPage).toHaveBeenCalledTimes(20);
  });
});
