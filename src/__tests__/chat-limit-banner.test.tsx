// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SyncErrorBanner,
  ThreadLimitBanner,
  DailyLimitBanner,
  TokenLimitBanner,
  GlobalBudgetWarningBanner,
  GlobalBudgetExhaustedBanner,
} from '@/components/chat/chat-limit-banner';

describe('Banners de limite/orçamento — acessibilidade', () => {
  it('todos os banners devem anunciar mudanças para leitores de tela (role=status + aria-live=polite)', () => {
    const { unmount: u1 } = render(<SyncErrorBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
    u1();

    const { unmount: u2 } = render(
      <ThreadLimitBanner onNewConversation={vi.fn()} isDailyLimitReached={false} />
    );
    expect(screen.getByRole('status')).toBeTruthy();
    u2();

    const { unmount: u3 } = render(<DailyLimitBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
    u3();

    const { unmount: u4 } = render(<TokenLimitBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
    u4();

    const { unmount: u5 } = render(<GlobalBudgetWarningBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
    u5();

    render(<GlobalBudgetExhaustedBanner />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('GlobalBudgetWarningBanner deve informar degradação sem bloquear', () => {
    render(<GlobalBudgetWarningBanner />);
    expect(screen.getByText(/orçamento diário do projeto está quase no limite/i)).toBeTruthy();
  });

  it('GlobalBudgetExhaustedBanner deve informar bloqueio até a meia-noite', () => {
    render(<GlobalBudgetExhaustedBanner />);
    expect(screen.getByText(/orçamento diário do projeto foi atingido/i)).toBeTruthy();
  });
});
