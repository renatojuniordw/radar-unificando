import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatJobDate } from '@/lib/utils/date';
import { normalizeJobType } from '@/lib/utils/job';
import {
  getMessageText,
  createWelcomeMessage,
  generateChatId,
  loadMessagesFromServer,
  saveMessagesToServer,
  CHAT_SUGGESTIONS,
} from '@/lib/utils/chat';
import { zodFieldErrors } from '@/lib/utils/form-errors';
import { uniqueValues, uniqueBy } from '@/lib/utils/array';

describe('date', () => {
  it('formatJobDate_prioriza_postedAt_valido', () => {
    const info = formatJobDate('2024-06-01T12:00:00', '2024-06-02T12:00:00');
    expect(info?.label).toBe('Publicada');
    expect(info?.full).toContain('2024');
  });

  it('formatJobDate_cai_para_detectedAt_quando_postedAt_invalido', () => {
    const info = formatJobDate('data-invalida', '2024-06-01T12:00:00');
    expect(info?.label).toBe('Adicionada');
    expect(info?.full).toContain('2024');
  });

  it('formatJobDate_retorna_null_sem_datas_validas', () => {
    expect(formatJobDate()).toBeNull();
    expect(formatJobDate('lixo', 'também-lixo')).toBeNull();
  });
});

describe('job.normalizeJobType', () => {
  it('normaliza_variacoes_de_tipo', () => {
    expect(normalizeJobType('Remote')).toBe('Remota');
    expect(normalizeJobType('remoto')).toBe('Remota');
    expect(normalizeJobType('Hybrid')).toBe('Híbrida');
    expect(normalizeJobType('híbrido')).toBe('Híbrida');
    expect(normalizeJobType('on-site')).toBe('Presencial');
    expect(normalizeJobType('presencial')).toBe('Presencial');
    expect(normalizeJobType(undefined)).toBe('');
    expect(normalizeJobType('Outro')).toBe('Outro');
  });

  it('normaliza_variacoes_adicionais_de_tipo', () => {
    expect(normalizeJobType('Home Office')).toBe('Remota');
    expect(normalizeJobType('Work From Home')).toBe('Remota');
    expect(normalizeJobType('WFH')).toBe('Remota');
    expect(normalizeJobType('Remota')).toBe('Remota');
    expect(normalizeJobType('onsite')).toBe('Presencial');
    expect(normalizeJobType('On Site')).toBe('Presencial');
    expect(normalizeJobType('In-Office')).toBe('Presencial');
    expect(normalizeJobType('In-Person')).toBe('Presencial');
  });
});

describe('chat utils', () => {
  it('getMessageText_extrai_apenas_partes_de_texto', () => {
    expect(
      getMessageText({ parts: [{ type: 'text', text: 'Olá ' }, { type: 'tool', text: 'ignorado' }, { type: 'text', text: 'mundo' }] }),
    ).toBe('Olá mundo');
    expect(getMessageText({})).toBe('');
  });

  it('createWelcomeMessage_usa_primeiro_nome', () => {
    expect(createWelcomeMessage('Maria Silva').parts[0].text).toContain('**Maria**');
    expect(createWelcomeMessage(null).parts[0].text).toContain('Olá!');
  });

  it('generateChatId_gera_id_unico_com_prefixo', () => {
    const id = generateChatId();
    expect(id.startsWith('chat-')).toBe(true);
    expect(generateChatId()).not.toBe(id);
  });

  it('CHAT_SUGGESTIONS_tem_sugestoes', () => {
    expect(CHAT_SUGGESTIONS.length).toBeGreaterThan(0);
  });

  it('loadMessagesFromServer_normaliza_mensagens_legadas', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ role: 'user', content: 'oi' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { messages, error } = await loadMessagesFromServer('chat-1');
    expect(error).toBe(false);
    expect(messages[0].parts?.[0].text).toBe('oi');
  });

  it('loadMessagesFromServer_retorna_erro_em_falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    const { messages, error } = await loadMessagesFromServer();
    expect(messages).toEqual([]);
    expect(error).toBe(true);
  });

  it('saveMessagesToServer_retorna_ok_ou_false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    expect(await saveMessagesToServer('chat-1', [])).toBe(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await saveMessagesToServer('chat-1', [])).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await saveMessagesToServer('chat-1', [])).toBe(false);
  });

  afterEach(() => vi.unstubAllGlobals());
});

describe('form-errors.zodFieldErrors', () => {
  it('mapeia_primeiro_erro_por_campo', () => {
    const errors = zodFieldErrors({
      issues: [
        { path: ['email'], message: 'obrigatório' },
        { path: ['email'], message: 'formato inválido' },
        { path: ['password'], message: 'mínimo 8' },
      ],
    });
    expect(errors).toEqual({ email: 'obrigatório', password: 'mínimo 8' });
  });
});

describe('array', () => {
  it('uniqueValues_remove_vazios_e_duplicados', () => {
    expect(uniqueValues(['a', '', 'b', 'a', null as any, 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('uniqueBy_deduplica_por_chave_preservando_primeira_ocorrencia', () => {
    const items = [
      { name: 'Acme', v: 1 },
      { name: 'acme', v: 2 },
      { name: 'Globex', v: 3 },
    ];
    expect(uniqueBy(items, (i) => i.name.toLowerCase())).toEqual([items[0], items[2]]);
  });

  it('uniqueBy_ignora_chaves_vazias', () => {
    expect(uniqueBy([{ k: 'x' }, { k: '' }], (i) => i.k)).toEqual([{ k: 'x' }]);
  });
});
