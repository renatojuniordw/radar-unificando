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
    delete (window as any).AudioContext;
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
    // Campo anexado ao DOM para o evento borbulhar até o listener global no window.
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'c' });
    input.remove();
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

  it('should_render_pending_banner_when_not_connected', () => {
    render(<TokenBox token={TOKEN} />);
    expect(screen.getByTestId('token-pending-banner')).toBeTruthy();
    expect(screen.getByText(/Como conectar:/)).toBeTruthy();
    const storeLink = screen.getByRole('link', { name: /Chrome Web Store/i });
    expect(storeLink.getAttribute('href')).toContain('chromewebstore.google.com');
  });

  it('should_hide_pending_banner_when_connected', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ connected: true, lastUsedAt: '2026-08-18T12:00:00Z' }),
    });
    render(<TokenBox token={TOKEN} />);
    expect(await screen.findByText(/Extensão Conectada/)).toBeTruthy();
    expect(screen.queryByTestId('token-pending-banner')).toBeNull();
  });

  it('should_not_show_copied_state_when_clipboard_fails', async () => {
    vi.useFakeTimers();
    writeText.mockRejectedValue(new Error('denied'));
    render(<TokenBox token={TOKEN} />);
    fireEvent.click(screen.getByLabelText('Copiar token para a área de transferência'));
    expect(writeText).toHaveBeenCalledWith(TOKEN);
    await act(async () => {});
    expect(screen.queryByText('Token Copiado!')).toBeNull();
    expect(screen.getByText('Copiar Token')).toBeTruthy();
  });

  it('should_not_copy_when_pressing_other_key', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.keyDown(window, { key: 'x' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_not_copy_when_pressing_ctrl_c', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_not_copy_when_typing_in_textarea_or_select', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireEvent.keyDown(textarea, { key: 'c' });
    textarea.remove();
    const select = document.createElement('select');
    document.body.appendChild(select);
    fireEvent.keyDown(select, { key: 'c' });
    select.remove();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_not_copy_when_pressing_meta_c_or_alt_c', () => {
    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.keyDown(window, { key: 'c', metaKey: true });
    fireEvent.keyDown(window, { key: 'c', altKey: true });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('should_play_click_sound_via_audio_context_when_copying', async () => {
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const mockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    class MockAudioContext {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return mockOsc;
      }
      createGain() {
        return mockGain;
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      value: MockAudioContext,
      configurable: true,
      writable: true,
    });

    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.click(screen.getByLabelText('Copiar token para a área de transferência'));
    await act(async () => {});

    expect(mockOsc.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalled();
    expect(mockOsc.start).toHaveBeenCalled();
    expect(mockOsc.stop).toHaveBeenCalled();
    expect(screen.getByText('Token Copiado!')).toBeTruthy();
  });

  it('should_ignore_audio_context_play_failure_and_still_copy', async () => {
    class BoomAudioContext {
      constructor() {
        throw new Error('Audio blocked');
      }
    }
    Object.defineProperty(window, 'AudioContext', {
      value: BoomAudioContext,
      configurable: true,
      writable: true,
    });

    writeText.mockResolvedValue(undefined);
    render(<TokenBox token={TOKEN} />);
    fireEvent.click(screen.getByLabelText('Copiar token para a área de transferência'));
    await act(async () => {});

    expect(writeText).toHaveBeenCalledWith(TOKEN);
    expect(screen.getByText('Token Copiado!')).toBeTruthy();
  });

  it('should_ignore_non_ok_polling_response', () => {
    fetchMock.mockResolvedValue({ ok: false });
    render(<TokenBox token={TOKEN} />);
    expect(screen.getByText('Ativo')).toBeTruthy();
    expect(screen.queryByTestId('token-connected-banner')).toBeNull();
  });
});