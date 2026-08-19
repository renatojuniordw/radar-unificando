// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('should_render_donation_link_to_doar_page', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /apoiar/i });
    expect(link.getAttribute('href')).toBe('/doar');
  });

  it('should_render_sobre_and_termos_links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /sobre/i }).getAttribute('href')).toBe('/sobre');
    expect(screen.getByRole('link', { name: /termos/i }).getAttribute('href')).toBe('/termos');
  });

  it('should_render_brand_and_description', () => {
    render(<Footer />);
    expect(screen.getByText('UNIFICANDO')).toBeTruthy();
    expect(screen.getByText(/Desenvolvido com foco total/)).toBeTruthy();
  });

  it('should_render_consultancy_link_to_unificando', () => {
    render(<Footer />);
    const link = screen.getByText('CONSULTORIA EM IA E DESENVOLVIMENTO').closest('a');
    expect(link?.getAttribute('href')).toBe('https://unificando.com.br/');
  });

  it('should_render_cursos_and_extensao_links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /cursos/i }).getAttribute('href')).toBe('/cursos');
    expect(screen.getByRole('link', { name: /extensão/i }).getAttribute('href')).toBe('/extensao');
  });

  it('should_render_author_credit', () => {
    render(<Footer />);
    expect(screen.getByText('Renato Bezerra')).toBeTruthy();
  });

  it('should_render_affiliate_disclosure', () => {
    render(<Footer />);
    expect(screen.getByText(/links desta plataforma são de afiliados/)).toBeTruthy();
  });

  it('should_render_cookie_settings_button', () => {
    render(<Footer />);
    expect(screen.getByRole('button', { name: /cookies/i })).toBeTruthy();
  });

  it('should_change_consultancy_link_colors_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('CONSULTORIA EM IA E DESENVOLVIMENTO') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.background).toBe('rgb(204, 255, 0)');
    expect(link.style.color).toBe('rgb(2, 6, 23)');
    fireEvent.mouseLeave(link);
    expect(link.style.background).toBe('transparent');
  });

  it('should_change_author_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('Renato Bezerra') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });

  });
