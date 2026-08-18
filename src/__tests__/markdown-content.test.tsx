// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownContent } from '@/components/chat/markdown-content';

describe('MarkdownContent', () => {
  it('should_render_job_card_with_anchored_view_job_button', () => {
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

  it('should_render_multiple_cards_in_order', () => {
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

  it('should_toggle_show_more_show_less_in_description', () => {
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

  it('should_not_leak_description_label_in_dom', () => {
    const text = '🏢 **A** — Acme\n🔗 https://acme.gupy.io/jobs/1\n**Descrição:** texto da vaga.';

    render(<MarkdownContent text={text} />);

    expect(screen.queryByText(/Descrição:/)).toBeNull();
    expect(screen.getByText('texto da vaga.')).toBeTruthy();
  });

  it('should_render_plain_markdown_without_jobs', () => {
    const text = 'Olá, **mundo**!';

    const { container } = render(<MarkdownContent text={text} />);

    expect(screen.getByText('mundo')).toBeTruthy();
    expect(container.textContent).toContain('Olá,');
    expect(container.textContent).toContain('!');
  });

  it('should_convert_single_line_break_to_br_in_fallback', () => {
    const text = 'Linha um\nLinha dois';

    const { container } = render(<MarkdownContent text={text} />);

    expect(container.querySelector('br')).toBeTruthy();
  });

  it('should_not_leak_functional_emojis_in_dom', () => {
    const text = '🏢 **A** — Acme\n📍 São Paulo | Remoto\n🔗 https://acme.gupy.io/jobs/1';

    render(<MarkdownContent text={text} />);

    expect(screen.queryByText(/🏢/)).toBeNull();
    expect(screen.queryByText(/📍/)).toBeNull();
    expect(screen.queryByText(/🔗/)).toBeNull();
  });

  it('should_not_render_javascript_href_in_markdown_link', () => {
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

  it('should_not_render_link_with_unknown_scheme', () => {
    const text = '[baixar](file:///etc/passwd)';

    const { container } = render(<MarkdownContent text={text} />);

    expect(container.querySelectorAll('a')).toHaveLength(0);
    expect(screen.getByText('baixar')).toBeTruthy();
  });

  it('should_convert_markdown_table_to_cards', () => {
    const text = '| Empresa | Vaga |\n|---|---|\n| Nubank | Dev |\n| iFood | QA |';
    const { container } = render(<MarkdownContent text={text} />);
    expect(container.textContent).toContain('Nubank');
    expect(container.textContent).toContain('iFood');
  });

  it('should_remove_star_emoji_from_content', () => {
    const text = 'Curso com 5 ⭐';
    const { container } = render(<MarkdownContent text={text} />);
    expect(container.textContent).toContain('Curso com');
    expect(container.textContent).not.toContain('⭐');
  });

  it('should_label_apply_button_for_candidature_links', () => {
    const text = '[Candidatar-se](https://gupy.io/jobs/1)';
    render(<MarkdownContent text={text} />);
    expect(screen.getByRole('link', { name: /candidatar-se/i })).toBeTruthy();
  });

  it('should_label_regular_links_as_visualizar', () => {
    const text = '[Saiba mais](https://unificando.com.br)';
    render(<MarkdownContent text={text} />);
    expect(screen.getByRole('link', { name: /saiba mais/i })).toBeTruthy();
  });

  it('should_render_headings_lists_and_hr', () => {
    const text = '## Título\n### Subtítulo\n- item um\n- item dois\n\n---\n\n1. primeiro\n2. segundo';
    const { container } = render(<MarkdownContent text={text} />);
    expect(screen.getByText('Título')).toBeTruthy();
    expect(screen.getByText('Subtítulo')).toBeTruthy();
    expect(screen.getByText('item um')).toBeTruthy();
    expect(screen.getByText('primeiro')).toBeTruthy();
    expect(container.querySelector('hr')).toBeTruthy();
  });

  it('should_render_course_card_from_markdown', () => {
    const text = '🎓 **Curso de Python** — Udemy\n💲 R$ 29,90\n🔗 https://udemy.com/course/python';
    render(<MarkdownContent text={text} />);
    expect(screen.getByText(/Curso de Python/)).toBeTruthy();
  });
});