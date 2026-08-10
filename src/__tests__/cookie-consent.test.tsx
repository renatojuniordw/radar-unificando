// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: () => <div data-testid="ga-loaded" />,
}));

import { CookieConsent } from '@/components/ui/cookie-consent';

describe('CookieConsent (LGPD)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deve_mostrar_banner_quando_sem_consentimento', () => {
    render(<CookieConsent />);
    expect(screen.getByRole('dialog', { name: 'Aviso de cookies' })).toBeTruthy();
    expect(screen.queryByTestId('ga-loaded')).toBeNull();
  });

  it('aceitar_esconde_banner_persiste_e_carrega_ga', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('cookie_consent')).toBe('accepted');
    expect(screen.getByTestId('ga-loaded')).toBeTruthy();
  });

  it('recusar_esconde_banner_persiste_e_nao_carrega_ga', () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('cookie_consent')).toBe('declined');
    expect(screen.queryByTestId('ga-loaded')).toBeNull();
  });

  it('nao_mostra_banner_quando_consentimento_ja_registrado', () => {
    localStorage.setItem('cookie_consent', 'accepted');
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('ga-loaded')).toBeTruthy();
  });
});
