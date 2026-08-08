// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from '@/components/chat/chat-header';

const baseProps = {
  loading: false,
  messageCount: 2,
  dailyCount: 1,
  dailyLimit: 50,
  contextTokens: 4200,
  contextTokenLimit: 16000,
  dailyTokens: 12480,
  dailyTokenLimit: 100000,
  monthlyTokens: 312000,
  monthlyTokenLimit: 2000000,
  sidebarOpen: false,
  onToggleSidebar: vi.fn(),
  onNewChat: vi.fn(),
  isDailyLimitReached: false,
  onClose: vi.fn(),
};

describe('ChatHeader', () => {
  it('deve_renderizar_identidade_status_e_metricas_rotuladas', () => {
    render(<ChatHeader {...baseProps} />);

    expect(screen.getByText('Assistente de Vagas')).toBeTruthy();
    expect(screen.getByLabelText('Online')).toBeTruthy();
    expect(screen.getByText(/Contexto 4,2k\/16k/)).toBeTruthy();
    expect(screen.getByText(/Hoje 12,5k\/100k/)).toBeTruthy();
    expect(screen.getByText(/Mês 312k\/2M/)).toBeTruthy();
  });

  it('deve_mostrar_digitando_quando_carregando', () => {
    render(<ChatHeader {...baseProps} loading />);

    expect(screen.getByText('Digitando...')).toBeTruthy();
    expect(screen.queryByLabelText('Online')).toBeNull();
  });

  it('deve_renderizar_barra_de_acoes', () => {
    render(<ChatHeader {...baseProps} />);

    expect(screen.getByRole('button', { name: /histórico/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /nova conversa/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /fechar chat/i })).toBeTruthy();
  });

  it('deve_desabilitar_nova_conversa_quando_limite_diario_atingido', () => {
    render(<ChatHeader {...baseProps} isDailyLimitReached />);

    expect(screen.getByRole('button', { name: /nova conversa/i })).toHaveProperty('disabled', true);
  });
});