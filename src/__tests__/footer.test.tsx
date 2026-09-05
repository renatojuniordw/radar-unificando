// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

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
    expect(screen.getByText(/Projeto autoral do laboratório Unificando/)).toBeTruthy();
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

  it('should_change_author_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('Renato Bezerra') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });

  it('should_render_navigation_section_with_rodape_label', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: 'Rodapé' })).toBeTruthy();
  });

  it('should_render_copyright_notice', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 RADAR UNIFICANDO/)).toBeTruthy();
  });

  it('should_render_author_link_with_external_attributes', () => {
    render(<Footer />);
    const link = screen.getByTestId('footer-portfolio-link') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('https://renatobezerra.com.br/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should_render_apoiar_link_with_accent_color', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /apoiar/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/doar');
    expect(link.style.color).toBe('rgb(204, 255, 0)');
  });

  it('should_render_termos_link_with_accent_color', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /termos/i }) as HTMLAnchorElement;
    expect(link.style.color).toBe('rgb(204, 255, 0)');
  });

  it('should_change_cursos_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('CURSOS') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });

  it('should_change_dicas_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('DICAS') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });

  it('should_change_extensao_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('EXTENSÃO') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });

  it('should_change_sobre_link_color_on_hover', () => {
    render(<Footer />);
    const link = screen.getByText('SOBRE') as HTMLAnchorElement;
    fireEvent.mouseEnter(link);
    expect(link.style.color).toBe('rgb(204, 255, 0)');
    fireEvent.mouseLeave(link);
    expect(link.style.color).toBe('rgb(148, 163, 184)');
  });
});
