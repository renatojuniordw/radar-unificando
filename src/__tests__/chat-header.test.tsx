// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('deve_exercitar_tons_de_aviso_quando_consumo_atinge_80_porcento', () => {
    render(
      <ChatHeader
        {...baseProps}
        contextTokens={12800} // 80% do limite de contexto
        dailyTokens={90000} // 90% do limite diário
        monthlyTokens={1800000} // 90% do limite mensal
      />,
    );

    // Branches warning de toneColor; valores formatados sem decimal truncado
    expect(screen.getByText(/Contexto 12,8k\/16k/)).toBeTruthy();
    expect(screen.getByText(/Hoje 90k\/100k/)).toBeTruthy();
    expect(screen.getByText(/Mês 1,8M\/2M/)).toBeTruthy();
  });

  it('deve_exercitar_tom_de_erro_no_consumo_diario_quando_teto_de_tokens_atingido', () => {
    render(<ChatHeader {...baseProps} isTokenLimitReached />);

    expect(screen.getByText(/Hoje/)).toBeTruthy();
  });

  it('deve_formatar_valores_abaixo_de_1000_sem_sufixo', () => {
    render(<ChatHeader {...baseProps} dailyTokens={999} />);

    expect(screen.getByText(/Hoje 999\/100k/)).toBeTruthy();
    // Branche `,0` de formatTokens: 1000 → "1k" (sem decimal)
    expect(screen.getByText(/Mês 312k\/2M/)).toBeTruthy();
  });

  it('deve_formatar_milhar_e_milhao_exatos_sem_decimal', () => {
    render(
      <ChatHeader {...baseProps} contextTokens={13000} dailyTokens={1000} monthlyTokens={1000000} />,
    );

    expect(screen.getByText(/Contexto 13k\/16k/)).toBeTruthy();
    expect(screen.getByText(/Hoje 1k\/100k/)).toBeTruthy();
    expect(screen.getByText(/Mês 1M\/2M/)).toBeTruthy();
  });

  it('deve_renderizar_link_lgpd_apontando_para_termos', () => {
    render(<ChatHeader {...baseProps} />);

    const link = screen.getByTestId('chat-lgpd-link');
    expect(link.getAttribute('href')).toBe('/termos');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('deve_chamar_callbacks_dos_botoes_de_acao', () => {
    render(<ChatHeader {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /histórico/i }));
    expect(baseProps.onToggleSidebar).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /fechar chat/i }));
    expect(baseProps.onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /nova conversa/i }));
    expect(baseProps.onNewChat).toHaveBeenCalled();
  });

  it('deve_trocar_titulo_do_botao_nova_conversa_quando_limite_diario_atingido', () => {
    render(<ChatHeader {...baseProps} isDailyLimitReached />);

    const button = screen.getByRole('button', { name: /nova conversa/i });
    expect(button.getAttribute('title')).toBe('Limite diário de interações atingido');
  });
});