// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatSuggestedReplies, getDynamicSuggestions } from '@/components/chat/chat-suggested-replies';

vi.mock('@mui/material', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Chip: ({ label, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {label}
    </button>
  ),
}));

vi.mock('@mui/icons-material', () => ({
  Assessment: () => <span data-testid="assessment-icon" />,
  Description: () => <span data-testid="description-icon" />,
  Search: () => <span data-testid="search-icon" />,
  RecordVoiceOver: () => <span data-testid="record-voice-over-icon" />,
  TrendingUp: () => <span data-testid="trending-up-icon" />,
}));

describe('ChatSuggestedReplies', () => {
  it('should render when not loading and has lastMessageText', () => {
    render(
      <ChatSuggestedReplies
        lastMessageText="Olá, como posso ajudar?"
        loading={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Analisar Currículo')).toBeTruthy();
    expect(screen.getByText('Buscar Vagas')).toBeTruthy();
    expect(screen.getByText('Panorama do Mercado')).toBeTruthy();
  });

  it('should not render when loading', () => {
    render(
      <ChatSuggestedReplies
        lastMessageText="Olá, como posso ajudar?"
        loading={true}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByText('Analisar Currículo')).toBeNull();
    expect(screen.queryByText('Buscar Vagas')).toBeNull();
    expect(screen.queryByText('Panorama do Mercado')).toBeNull();
  });

  it('should not render when lastMessageText is empty', () => {
    render(
      <ChatSuggestedReplies
        lastMessageText=""
        loading={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByText('Analisar Currículo')).toBeNull();
  });

  it('should call onSelect with correct prompt when suggestion is clicked', () => {
    const onSelect = vi.fn();
    render(
      <ChatSuggestedReplies
        lastMessageText="Olá, como posso ajudar?"
        loading={false}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Analisar Currículo'));
    expect(onSelect).toHaveBeenCalledWith(
      'Analise meu perfil cadastrado e sugira melhorias no currículo.'
    );

    fireEvent.click(screen.getByText('Buscar Vagas'));
    expect(onSelect).toHaveBeenCalledWith(
      'Busque vagas de tecnologia alinhadas ao meu perfil no Gupy.'
    );

    fireEvent.click(screen.getByText('Panorama do Mercado'));
    expect(onSelect).toHaveBeenCalledWith(
      'Como está o mercado de tecnologia para o meu perfil hoje?'
    );
  });

  it('should show job-related suggestions when message contains "vaga"', () => {
    render(
      <ChatSuggestedReplies
        lastMessageText="Encontrei uma vaga interessante"
        loading={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Analisar Fit')).toBeTruthy();
    expect(screen.getByText('Gerar Carta')).toBeTruthy();
    expect(screen.getByText('Ver Mais Vagas')).toBeTruthy();
  });

  it('should show interview suggestions when message contains "entrevista"', () => {
    render(
      <ChatSuggestedReplies
        lastMessageText="Tenho uma entrevista marcada"
        loading={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Simular Entrevista')).toBeTruthy();
    expect(screen.getByText('Analisar Fit')).toBeTruthy();
  });

  it('should handle getDynamicSuggestions with "entrevista"', () => {
    const suggestions = getDynamicSuggestions('Vamos preparar a entrevista');
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].label).toBe('Simular Entrevista');
    expect(suggestions[1].label).toBe('Analisar Fit');
  });

  it('should handle getDynamicSuggestions with "pergunta"', () => {
    const suggestions = getDynamicSuggestions('Quais perguntas podem cair?');
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].label).toBe('Simular Entrevista');
  });

  it('should handle getDynamicSuggestions with "roteiro"', () => {
    const suggestions = getDynamicSuggestions('Preciso de um roteiro');
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].label).toBe('Simular Entrevista');
  });
});
