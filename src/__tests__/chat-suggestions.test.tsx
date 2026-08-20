// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/utils/chat', () => ({
  CHAT_SUGGESTIONS: [
    'Quais vagas de DevOps estão abertas?',
    'Analise meu perfil para vagas remotas',
    'Recomende vagas de Front-end com React',
    'Como está o mercado de dados?',
  ],
}));

import { ChatSuggestions } from '@/components/chat/chat-suggestions';

describe('ChatSuggestions', () => {
  it('should_render_all_suggestion_chips', () => {
    render(<ChatSuggestions onSelect={vi.fn()} />);
    expect(screen.getByText('Quais vagas de DevOps estão abertas?')).toBeTruthy();
    expect(screen.getByText('Analise meu perfil para vagas remotas')).toBeTruthy();
    expect(screen.getByText('Recomende vagas de Front-end com React')).toBeTruthy();
    expect(screen.getByText('Como está o mercado de dados?')).toBeTruthy();
  });

  it('should_call_onSelect_when_suggestion_clicked', () => {
    const onSelect = vi.fn();
    render(<ChatSuggestions onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Quais vagas de DevOps estão abertas?'));
    expect(onSelect).toHaveBeenCalledWith('Quais vagas de DevOps estão abertas?');
  });

  it('should_call_onSelect_with_correct_value_for_each_suggestion', () => {
    const onSelect = vi.fn();
    render(<ChatSuggestions onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Recomende vagas de Front-end com React'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Recomende vagas de Front-end com React');
  });
});
