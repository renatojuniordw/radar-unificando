// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/lib/infrastructure/ui/tokens', () => ({
  tokens: {
    accent: '#ccff00',
    fontMono: 'ui-monospace, monospace',
  },
}));

import { ChatTeaser } from '@/components/shared/chat-teaser';

describe('ChatTeaser', () => {
  it('should_render_assistant_label', () => {
    render(<ChatTeaser />);
    expect(screen.getByText(/Assistente de Carreira/)).toBeTruthy();
  });

  it('should_render_description_text', () => {
    render(<ChatTeaser />);
    expect(screen.getByText(/Analise seu currículo/)).toBeTruthy();
  });

  it('should_render_login_link', () => {
    render(<ChatTeaser />);
    const link = screen.getByRole('link', { name: /ENTRAR/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('should_render_register_link', () => {
    render(<ChatTeaser />);
    const link = screen.getByRole('link', { name: /CRIAR CONTA/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/register');
  });
});
