// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sendGAEvent: mockSendGAEvent } = vi.hoisted(() => ({ sendGAEvent: vi.fn() }));
vi.mock('@next/third-parties/google', () => ({ sendGAEvent: mockSendGAEvent }));

import { trackEvent, trackJobSearch, trackJobApply, trackExportCsv, trackAiChat } from '@/lib/utils/analytics';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_GA_ID', 'G-XXXX');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('trackEvent', () => {
  it('should_send_event_when_window_and_ga_id_present', () => {
    trackEvent('custom_event', { key: 'value' });
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'custom_event', { key: 'value' });
  });

  it('should_send_empty_params_when_none_provided', () => {
    trackEvent('custom_event');
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'custom_event', {});
  });

  it('should_not_send_when_ga_id_missing', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_ID', '');
    trackEvent('custom_event');
    expect(mockSendGAEvent).not.toHaveBeenCalled();
  });

  it('should_not_throw_when_ga_is_blocked', () => {
    mockSendGAEvent.mockImplementation(() => {
      throw new Error('adblock');
    });
    expect(() => trackEvent('custom_event')).not.toThrow();
  });
});

describe('trackJobSearch', () => {
  it('should_map_search_params', () => {
    trackJobSearch({ searchTerm: 'python', companies: ['A', 'B', 'C', 'D', 'E', 'F'], roles: ['Dev'] });
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'search_jobs', {
      search_term: 'python',
      total_empresas: 6,
      empresas: 'A,B,C,D,E',
      cargos: 'Dev',
    });
  });

  it('should_default_empty_values', () => {
    trackJobSearch({});
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'search_jobs', {
      search_term: '',
      total_empresas: 0,
      empresas: '',
      cargos: '',
    });
  });
});

describe('trackJobApply', () => {
  it('should_map_gupy_domain', () => {
    trackJobApply({ title: 'Dev', company: 'A', platform: 'Gupy', link: 'https://gupy.io/1' });
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'apply_job_click', expect.objectContaining({ link_domain: 'gupy' }));
  });

  it('should_map_non_gupy_domain_as_inhire', () => {
    trackJobApply({ title: 'Dev', company: 'A', platform: 'InHire', link: 'https://inhire.io/1' });
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'apply_job_click', expect.objectContaining({ link_domain: 'inhire' }));
  });
});

describe('trackExportCsv / trackAiChat', () => {
  it('should_track_csv_export_with_count', () => {
    trackExportCsv(42);
    expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'export_csv', { total_vagas: 42 });
  });

  it('should_track_ai_chat_actions', () => {
    trackAiChat('send_message');
    trackAiChat('open_chat');
    trackAiChat('clear_history');
    expect(mockSendGAEvent).toHaveBeenCalledTimes(3);
    expect(mockSendGAEvent).toHaveBeenLastCalledWith('event', 'ai_assistant_action', { action: 'clear_history' });
  });
});