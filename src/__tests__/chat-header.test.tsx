// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from '@/components/chat-assistant/chat-header';

const baseProps = {
  loading: false,
  messageCount: 2,
  dailyCount: 1,
  dailyLimit: 50,
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
    expect(screen.getByText(/Contexto 2\/25/)).toBeTruthy();
    expect(screen.getByText(/Hoje 1\/50/)).toBeTruthy();
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