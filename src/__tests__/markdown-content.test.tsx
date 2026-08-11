// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownContent } from '@/components/chat/markdown-content';

describe('MarkdownContent', () => {
  it('deve_renderizar_card_de_vaga_com_botao_ver_vaga_ancorado', () => {
    const text = [
      '🏢 **Integration Software Engineer** — Nubank',
      '📍 São Paulo | Remoto',
      '📅 Publicada em 05/08/2026',
      '🔗 https://nubank.gupy.io/jobs/123',
    ].join('\n');

    render(<MarkdownContent text={text} />);

    expect(screen.getByText('Integration Software Engineer')).toBeTruthy();
    expect(screen.getByText('Nubank')).toBeTruthy();
    expect(screen.getByText(/São Paulo/)).toBeTruthy();
    expect(screen.getByText(/Remoto/)).toBeTruthy();
    expect(screen.getByText(/Publicada em 05\/08\/2026/)).toBeTruthy();

    const link = screen.getByRole('link', { name: /ver vaga/i });
    expect(link.getAttribute('href')).toBe('https://nubank.gupy.io/jobs/123');
    expect(link.getAttribute('target')).toBe('_blank');

    expect(screen.queryByText(/🔗/)).toBeNull();
  });

  it('deve_renderizar_multiplos_cards_em_ordem', () => {
    const text = [
      '🏢 **Vaga A** — Co',
      '🔗 https://a.gupy.io/jobs/1',
      '',
      '🏢 **Vaga B** — Co',
      '🔗 https://b.gupy.io/jobs/2',
    ].join('\n');

    render(<MarkdownContent text={text} />);

    const links = screen.getAllByRole('link', { name: /ver vaga/i });
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('https://a.gupy.io/jobs/1');
    expect(links[1].getAttribute('href')).toBe('https://b.gupy.io/jobs/2');
  });

  it('deve_alternar_ver_mais_ver_menos_na_descricao', () => {
    const text = [
      '🏢 **Dev** — Acme',
      '🔗 https://acme.gupy.io/jobs/1',
      '**Descrição:** Uma descrição longa o suficiente para o card.',
    ].join('\n');

    render(<MarkdownContent text={text} />);

    const toggle = screen.getByRole('button', { name: /ver mais/i });
    expect(toggle).toBeTruthy();
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /ver menos/i })).toBeTruthy();
  });

  it('nao_deve_vazar_rotulo_descricao_no_dom', () => {
    const text = '🏢 **A** — Acme\n🔗 https://acme.gupy.io/jobs/1\n**Descrição:** texto da vaga.';

    render(<MarkdownContent text={text} />);

    expect(screen.queryByText(/Descrição:/)).toBeNull();
    expect(screen.getByText('texto da vaga.')).toBeTruthy();
  });

  it('deve_renderizar_markdown_puro_sem_vagas', () => {
    const text = 'Olá, **mundo**!';

    const { container } = render(<MarkdownContent text={text} />);

    expect(screen.getByText('mundo')).toBeTruthy();
    expect(container.textContent).toContain('Olá,');
    expect(container.textContent).toContain('!');
  });

  it('deve_converter_quebra_de_linha_simples_em_br_no_fallback', () => {
    const text = 'Linha um\nLinha dois';

    const { container } = render(<MarkdownContent text={text} />);

    expect(container.querySelector('br')).toBeTruthy();
  });

  it('nao_deve_vazar_emojis_funcionais_no_dom', () => {
    const text = '🏢 **A** — Acme\n📍 São Paulo | Remoto\n🔗 https://acme.gupy.io/jobs/1';

    render(<MarkdownContent text={text} />);

    expect(screen.queryByText(/🏢/)).toBeNull();
    expect(screen.queryByText(/📍/)).toBeNull();
    expect(screen.queryByText(/🔗/)).toBeNull();
  });

  it('nao_deve_renderizar_href_javascript_em_link_markdown', () => {
    // Saída de LLM com link malicioso: react-markdown não sanitiza URLs por si só.
    const text = 'Veja [este link](javascript:alert(1)) e [outro](https://ok.gupy.io/jobs/1)';

    const { container } = render(<MarkdownContent text={text} />);

    const anchors = container.querySelectorAll('a');
    // Só o link https:// é renderizado como âncora.
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute('href')).toBe('https://ok.gupy.io/jobs/1');
    // O texto do link malicioso continua visível, mas sem href.
    expect(screen.getByText('este link')).toBeTruthy();
  });

  it('nao_deve_renderizar_link_com_esquema_desconhecido', () => {
    const text = '[baixar](file:///etc/passwd)';

    const { container } = render(<MarkdownContent text={text} />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.getByText('baixar')).toBeTruthy();
  });
});