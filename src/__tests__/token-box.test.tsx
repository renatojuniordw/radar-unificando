// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TokenBox } from '@/app/(dashboard)/extensao/conectar/token-box';

const TOKEN = 'abc123'.repeat(10);

describe('TokenBox', () => {
  const fetchMock = vi.fn();
  const writeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ connected: false }) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('should_render_token_masked_by_default', () => {
    render(<TokenBox token={TOKEN} />);
    expect(screen.getByText('Seu Token de Conexão Único')).toBeTruthy();
    expect(screen.queryByText(TOKEN)).toBeNull();
    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('should_show_full_token_when_revealed', () => {
    render(<TokenBox token={TOKEN} />);
    fireEvent.click(screen.getByLabelText('Revelar token completo'));
    expect(screen.getByText(TOKEN)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Ocultar token para privacidade'));
    expect(screen.queryByText(TOKEN)).toBeNull();
  });

  it('should_copy_token_and_show_copied_state', async () => {
    vi.useFakeTimers();
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.click(screen.getByLabelText('Copiar token para a área de transferência'));
    expect(writeText).toHaveBeenCalledWith(TOKEN);
    await act(async () => {});
    expect(screen.getByText('Token Copiado!')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2200);
    });
    expect(screen.getByText('Copiar Token')).toBeTruthy();
  });

  it('should_copy_token_when_pressing_c_key', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.keyDown(window, { key: 'c' });
    expect(writeText).toHaveBeenCalledWith(TOKEN);
  });

  it('should_not_copy_when_typing_in_input', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    const input = document.createElement('input');
    fireEvent.keyDown(input, { key: 'c' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_show_connected_status_when_polling_reports_connected', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ connected: true, lastUsedAt: '2026-08-18T12:00:00Z' }) });
    render(<TokenBox token={TOKEN} />);
    expect(await screen.findByText(/Extensão Conectada/)).toBeTruthy();
    expect(screen.getByText('Sincronizado')).toBeTruthy();
    expect(screen.getByText(/Último uso:/)).toBeTruthy();
  });

  it('should_ignore_polling_failure', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    render(<TokenBox token={TOKEN} />);
    expect(screen.getByText('Ativo')).toBeTruthy();
  });
});