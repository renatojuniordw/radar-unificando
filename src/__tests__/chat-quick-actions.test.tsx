// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ChatQuickActions } from '@/components/chat/chat-quick-actions';

describe('ChatQuickActions', () => {
  it('should_render_all_chips', () => {
    render(<ChatQuickActions loading={false} onSelect={vi.fn()} />);
    expect(screen.getByText('Buscar vagas')).toBeTruthy();
    expect(screen.getByText('Analisar perfil')).toBeTruthy();
    expect(screen.getByText('Gerar carta')).toBeTruthy();
  });

  it('should_call_onSelect_when_chip_clicked', () => {
    const onSelect = vi.fn();
    render(<ChatQuickActions loading={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Buscar vagas'));
    expect(onSelect).toHaveBeenCalledWith('Busque vagas alinhadas ao meu perfil');
  });

  it('should_call_onSelect_with_analisar_perfil_prompt', () => {
    const onSelect = vi.fn();
    render(<ChatQuickActions loading={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Analisar perfil'));
    expect(onSelect).toHaveBeenCalledWith('Analise meu perfil e me diga como estão minhas chances');
  });

  it('should_call_onSelect_with_gerar_carta_prompt', () => {
    const onSelect = vi.fn();
    render(<ChatQuickActions loading={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Gerar carta'));
    expect(onSelect).toHaveBeenCalledWith('Gere uma carta de apresentação para uma vaga');
  });

  it('should_disable_chips_when_loading', () => {
    render(<ChatQuickActions loading={true} onSelect={vi.fn()} />);
    const chips = document.querySelectorAll('.MuiChip-root');
    chips.forEach((chip) => {
      expect(chip.classList.contains('Mui-disabled')).toBe(true);
    });
  });
});
