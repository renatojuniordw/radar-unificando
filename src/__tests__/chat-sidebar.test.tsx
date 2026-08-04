// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatSidebar } from '@/components/chat-sidebar';

const conversations = [
  { id: 'chat-1', title: 'Vagas de dados', lastMessage: 'Encontrei 5 vagas...', createdAt: new Date() },
  { id: 'chat-2', title: 'Análise de perfil', lastMessage: 'Seu perfil está...', createdAt: new Date() },
];

describe('ChatSidebar', () => {
  it('should_render_empty_state_when_no_conversations', () => {
    render(<ChatSidebar conversations={[]} activeId={null} onSelect={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('Nenhuma conversa ainda')).toBeTruthy();
  });

  it('should_render_conversation_list', () => {
    render(<ChatSidebar conversations={conversations} activeId={null} onSelect={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('Vagas de dados')).toBeTruthy();
    expect(screen.getByText('Análise de perfil')).toBeTruthy();
  });

  it('should_call_onSelect_when_conversation_clicked', () => {
    const onSelect = vi.fn();
    render(<ChatSidebar conversations={conversations} activeId={null} onSelect={onSelect} onNew={vi.fn()} />);
    fireEvent.click(screen.getByText('Vagas de dados'));
    expect(onSelect).toHaveBeenCalledWith('chat-1');
  });

  it('should_call_onNew_when_new_conversation_button_clicked', () => {
    const onNew = vi.fn();
    render(<ChatSidebar conversations={conversations} activeId={null} onSelect={vi.fn()} onNew={onNew} />);
    fireEvent.click(screen.getByText('Nova Conversa'));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
