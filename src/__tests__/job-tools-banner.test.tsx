// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    primary: '#020617',
    accent: '#ccff00',
    fontMono: 'ui-monospace, monospace',
  },
}));

import { JobToolsBanner } from '@/components/busca/job-tools-banner';

describe('JobToolsBanner', () => {
  it('anonymous_renders_title_description_and_ctas', () => {
    render(<JobToolsBanner variant="anonymous" />);

    expect(screen.getByText(/Desbloqueie as ferramentas de carreira/)).toBeTruthy();
    expect(screen.getByText(/Análise ATS de cada vaga/)).toBeTruthy();
    expect(screen.getByText(/Comparativo de vagas no assistente/)).toBeTruthy();

    const login = screen.getByRole('link', { name: /ENTRAR/i });
    expect(login).toBeTruthy();
    expect(login.getAttribute('href')).toBe('/login?callbackUrl=/busca');

    const register = screen.getByRole('link', { name: /CRIAR CONTA/i });
    expect(register).toBeTruthy();
    expect(register.getAttribute('href')).toBe('/register?callbackUrl=/busca');
  });

  it('no_resume_renders_profile_cta', () => {
    render(<JobToolsBanner variant="no-resume" />);

    expect(screen.getByText(/Seu perfil está incompleto/)).toBeTruthy();
    expect(screen.getByText(/Adicione seu currículo/)).toBeTruthy();

    const perfil = screen.getByRole('link', { name: /IMPORTAR CURRÍCULO/i });
    expect(perfil).toBeTruthy();
    expect(perfil.getAttribute('href')).toBe('/perfil');
  });

  it('anonymous_does_not_show_profile_cta', () => {
    render(<JobToolsBanner variant="anonymous" />);
    expect(screen.queryByRole('link', { name: /IMPORTAR CURRÍCULO/i })).toBeNull();
  });
});