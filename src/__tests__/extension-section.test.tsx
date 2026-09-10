// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('lucide-react', () => ({
  ArrowRight: (props: any) => <svg data-testid="arrow-right" {...props} />,
  Zap: (props: any) => <svg data-testid="zap-icon" {...props} />,
  ShieldCheck: (props: any) => <svg data-testid="shield-icon" {...props} />,
  Download: (props: any) => <svg data-testid="download-icon" {...props} />,
}));

import { ExtensionSection } from '@/components/home/extension-section';

describe('ExtensionSection', () => {
  it('should_render_extension_badge', () => {
    render(<ExtensionSection />);
    expect(screen.getByText('EXTENSÃO CHROME ATS')).toBeTruthy();
  });

  it('should_render_chrome_store_install_link', () => {
    render(<ExtensionSection />);
    const link = screen.getByRole('link', { name: /INSTALAR NO CHROME/i });
    expect(link.getAttribute('href')).toContain('chromewebstore.google.com');
  });

  it('should_render_extension_heading', () => {
    render(<ExtensionSection />);
    expect(screen.getByText(/ANALISE A VAGA NA HORA/)).toBeTruthy();
  });

  it('should_render_extension_description', () => {
    render(<ExtensionSection />);
    expect(screen.getByText(/Veja o score ATS do seu currículo/)).toBeTruthy();
  });

  it('should_render_features', () => {
    render(<ExtensionSection />);
    expect(screen.getByText('Score Automático')).toBeTruthy();
    expect(screen.getByText('100% Seguro')).toBeTruthy();
  });

  it('should_render_details_link', () => {
    render(<ExtensionSection />);
    const link = screen.getByRole('link', { name: /VER DETALHES/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/extensao');
  });
});
