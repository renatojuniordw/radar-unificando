// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const sessionState = vi.hoisted(() => ({ data: null as unknown }));
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: sessionState.data,
    status: sessionState.data ? 'authenticated' : 'unauthenticated',
  })),
}));

const profileState = vi.hoisted(() => ({
  skills: [] as string[],
  currentRole: null as string | null,
  area: null as string | null,
}));
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    skills: profileState.skills,
    currentRole: profileState.currentRole,
    area: profileState.area,
  })),
}));

vi.mock('@/lib/utils/analytics', () => ({
  trackJobSearch: vi.fn(),
}));

const storageMock = vi.hoisted(() => ({
  getJobs: vi.fn(),
  setJobs: vi.fn(),
  getFilters: vi.fn(),
  setFilters: vi.fn(),
  getLastRunAt: vi.fn(),
  setLastRunAt: vi.fn(),
  getCooldownEnd: vi.fn(),
  setCooldownEnd: vi.fn(),
  clearCooldown: vi.fn(),
  clear: vi.fn(),
}));
vi.mock('@/lib/infrastructure/storage/browser-storage', () => ({
  browserStorage: storageMock,
}));

import { useJobSearch } from '@/hooks/useJobSearch';
import { trackJobSearch } from '@/lib/utils/analytics';

// jsdom não implementa EventSource — stub que captura as instâncias criadas
// para os testes dispararem onmessage/onerror manualmente.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onopen: unknown = null;
  onmessage: unknown = null;
  onerror: unknown = null;
  url: string;
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener() {}
  removeEventListener() {}
  close() {
    this.closed = true;
  }
}
(globalThis as any).EventSource = FakeEventSource;

const fetchMock = vi.fn();
(globalThis as any).fetch = fetchMock;

const fetchRoutes: Record<string, { status: number; body: unknown } | { throws: true }> = {};
fetchMock.mockImplementation(async (input: any, init?: any) => {
  const url = String(input);
  const method = (init?.method ?? 'GET').toUpperCase();
  const r = fetchRoutes[`${method} ${url}`] ?? { status: 200, body: {} };
  if ('throws' in r) throw new TypeError('Failed to fetch');
  return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body };
});

function setRoute(method: string, url: string, status: number, body: unknown) {
  fetchRoutes[`${method} ${url}`] = { status, body };
}

function setRouteThrow(method: string, url: string) {
  fetchRoutes[`${method} ${url}`] = { throws: true };
}

function lastEventSource() {
  return FakeEventSource.instances[FakeEventSource.instances.length - 1];
}

// Settle as promises dos effects de montagem (getFilters/getCooldownEnd/getJobs
// têm encadeamentos .then/.finally que exigem várias microtasks).
async function flushMount() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

const JOB_DEV = { id: '1', title: 'Dev', company: 'Acme', roleCategory: 'dev' };
const JOB_OPS = { id: '2', title: 'Ops', company: 'Globex', roleCategory: 'ops' };

describe('useJobSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionState.data = null;
    profileState.skills = [];
    profileState.currentRole = null;
    profileState.area = null;
    FakeEventSource.instances = [];
    Object.keys(fetchRoutes).forEach((k) => delete fetchRoutes[k]);
    setRoute('GET', '/api/vagas', 200, []);
    setRoute('POST', '/api/pipeline', 200, { runId: 'run-x', cooldownSeconds: 0 });
    storageMock.getJobs.mockResolvedValue([]);
    storageMock.setJobs.mockResolvedValue(undefined);
    storageMock.getFilters.mockResolvedValue(null);
    storageMock.setFilters.mockResolvedValue(undefined);
    storageMock.getLastRunAt.mockResolvedValue(null);
    storageMock.setLastRunAt.mockResolvedValue(undefined);
    storageMock.getCooldownEnd.mockResolvedValue(null);
    storageMock.setCooldownEnd.mockResolvedValue(undefined);
    storageMock.clearCooldown.mockResolvedValue(undefined);
    storageMock.clear.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loadJobs', () => {
    it('aplica_filtros_na_query_e_atualiza_jobs_categorias_e_storage_anonimo', async () => {
      setRoute('GET', '/api/vagas?platform=gupy&role=dev&search=react', 200, [JOB_DEV, JOB_OPS]);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs({ platform: 'gupy', role: 'dev', search: 'react' });
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/vagas?platform=gupy&role=dev&search=react');
      expect(result.current.jobs).toHaveLength(2);
      expect(result.current.roleCategories).toEqual(['dev', 'ops']);
      expect(result.current.loading).toBe(false);
      // Anônimo: persiste as vagas no storage.
      expect(storageMock.setJobs).toHaveBeenCalledWith([JOB_DEV, JOB_OPS]);
    });

    it('sem_filtros_chama_sem_query_e_nao_persiste_lista_vazia', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs();
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/vagas');
      expect(result.current.jobs).toEqual([]);
      expect(storageMock.setJobs).not.toHaveBeenCalled();
    });

    it('dados_nao_array_sao_tratados_como_lista_vazia', async () => {
      setRoute('GET', '/api/vagas', 200, { resultado: 'inesperado' });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs();
      });

      expect(result.current.jobs).toEqual([]);
    });

    it('429_mostra_snackbar_de_rate_limit', async () => {
      setRoute('GET', '/api/vagas', 429, { error: 'rate' });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs();
      });

      expect(result.current.snackbar?.severity).toBe('error');
      expect(result.current.snackbar?.message).toContain('Muitas buscas');
    });

    it('erro_generico_mostra_snackbar_de_falha', async () => {
      setRoute('GET', '/api/vagas', 500, {});
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs();
      });

      expect(result.current.snackbar?.message).toContain('Falha ao carregar vagas');
    });

    it('erro_de_rede_mostra_snackbar_de_conexao', async () => {
      setRouteThrow('GET', '/api/vagas');
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.loadJobs();
      });

      expect(result.current.snackbar?.message).toContain('Erro de conexão');
      expect(result.current.loading).toBe(false);
    });

    it('modo_recomendado_envia_recommended_e_dispara_loadJobs_no_mount_quando_logado', async () => {
      sessionState.data = { user: { id: 'u1' } };
      profileState.skills = ['a', 'b', 'c'];
      profileState.currentRole = 'Dev';
      setRoute('GET', '/api/vagas?recommended=1', 200, [JOB_DEV]);

      const { result } = renderHook(() => useJobSearch());
      // queueMicrotask do effect de montagem
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.minimalProfile).toBe(true);
      expect(result.current.recommendedMode).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('/api/vagas?recommended=1');
      expect(result.current.jobs).toEqual([JOB_DEV]);
      // Logado: não persiste no storage de anônimo.
      expect(storageMock.setJobs).not.toHaveBeenCalled();
    });

    it('modo_recomendado_exige_perfil_minimo', async () => {
      sessionState.data = { user: { id: 'u1' } };
      profileState.skills = ['apenas', 'dois'];
      const { result } = renderHook(() => useJobSearch());

      await flushMount();

      expect(result.current.minimalProfile).toBe(false);
      expect(result.current.recommendedMode).toBe(false);
    });
  });

  describe('effects de montagem e persistência', () => {
    it('anônimo_carrega_vagas_salvas_do_storage', async () => {
      storageMock.getJobs.mockResolvedValue([JOB_DEV]);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.jobs).toEqual([JOB_DEV]);
    });

    it('carrega_lastRunAt_filtros_e_cooldown_na_montagem', async () => {
      storageMock.getLastRunAt.mockResolvedValue(1234567890);
      storageMock.getFilters.mockResolvedValue({ companies: ['Acme'], roles: ['dev'] });
      storageMock.getCooldownEnd.mockResolvedValue(Date.now() + 120_000);

      const { result } = renderHook(() => useJobSearch());
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.lastRunAt).toBe(1234567890);
      expect(result.current.companies).toEqual(['Acme']);
      expect(result.current.roleQueries).toEqual(['dev']);
      expect(result.current.cooldown).toBeGreaterThan(0);
    });

    it('cooldown_expirado_limpa_o_storage', async () => {
      storageMock.getCooldownEnd.mockResolvedValue(Date.now() - 5000);

      const { result } = renderHook(() => useJobSearch());
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cooldown).toBe(0);
      expect(storageMock.clearCooldown).toHaveBeenCalled();
    });

    it('persiste_filtros_a_cada_alteracao', async () => {
      // Última busca recente: evita o effect de auto-sync disparar ao mudar filtros.
      storageMock.getLastRunAt.mockResolvedValue(Date.now());
      const { result } = renderHook(() => useJobSearch());
      await flushMount();

      act(() => result.current.setCompanies(['Acme']));
      act(() => result.current.setRoleQueries(['dev']));

      expect(storageMock.setFilters).toHaveBeenCalledWith({ companies: ['Acme'], roles: ['dev'] });
    });

    it('cooldown_conta_regressiva_e_limpa_storage_ao_zerar', async () => {
      vi.useFakeTimers();
      storageMock.getCooldownEnd.mockResolvedValue(Date.now() + 2000);
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.cooldown).toBe(2);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.cooldown).toBe(0);
      expect(storageMock.clearCooldown).toHaveBeenCalled();
    });
  });

  describe('handleStart', () => {
    it('busca_manual_sucesso_processa_stream_complete_anonimo', async () => {
      setRoute('POST', '/api/pipeline', 200, { runId: 'r1', cooldownSeconds: 0 });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      expect(result.current.running).toBe(true);
      expect(trackJobSearch).toHaveBeenCalledWith({ companies: [], roles: [] });
      expect(storageMock.clear).toHaveBeenCalled(); // anônimo limpa dados antigos

      await act(async () => {
        await (lastEventSource().onmessage as any)({
          data: JSON.stringify({ type: 'pipeline_complete', jobs: [JOB_DEV, JOB_OPS] }),
        });
      });

      expect(result.current.running).toBe(false);
      expect(result.current.jobs).toEqual([
        { ...JOB_DEV, detectedAt: '' },
        { ...JOB_OPS, detectedAt: '' },
      ]);
      expect(result.current.roleCategories).toEqual(['dev', 'ops']);
      expect(result.current.snackbar?.severity).toBe('success');
      expect(storageMock.setJobs).toHaveBeenCalledWith([JOB_DEV, JOB_OPS]);
      expect(storageMock.setLastRunAt).toHaveBeenCalled();
    });

    it('stream_pipeline_error_mostra_snackbar_de_erro_e_recarrega', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      await act(async () => {
        await (lastEventSource().onmessage as any)({
          data: JSON.stringify({ type: 'pipeline_error', message: 'Gupy caiu' }),
        });
      });

      expect(result.current.snackbar?.severity).toBe('error');
      expect(result.current.snackbar?.message).toContain('Gupy caiu');
      expect(result.current.running).toBe(false);
    });

    it('stream_pipeline_cancelled_mostra_snackbar_de_erro', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      await act(async () => {
        await (lastEventSource().onmessage as any)({
          data: JSON.stringify({ type: 'pipeline_cancelled', message: 'Cancelada pelo usuário' }),
        });
      });

      expect(result.current.snackbar?.severity).toBe('error');
      expect(result.current.snackbar?.message).toContain('Cancelada pelo usuário');
      expect(result.current.running).toBe(false);
    });

    it('stream_json_invalido_mostra_erro_de_processamento', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      await act(async () => {
        await (lastEventSource().onmessage as any)({ data: 'isso não é json' });
      });

      expect(result.current.snackbar?.message).toContain('Erro ao processar');
      expect(result.current.running).toBe(false);
    });

    it('stream_complete_sem_array_de_jobs_recarrega_vagas', async () => {
      const { result } = renderHook(() => useJobSearch());
      fetchMock.mockClear();

      await act(async () => {
        await result.current.handleStart();
      });
      fetchMock.mockClear();

      await act(async () => {
        await (lastEventSource().onmessage as any)({
          data: JSON.stringify({ type: 'pipeline_complete', jobs: 'não-é-array' }),
        });
      });

      // Sem jobs no evento: recarrega via /api/vagas e mostra sucesso.
      expect(result.current.snackbar?.severity).toBe('success');
      expect(fetchMock).toHaveBeenCalledWith('/api/vagas');
      expect(result.current.running).toBe(false);
    });

    it('stream_onerror_mostra_falha_de_conexao', async () => {
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      await act(async () => {
        await (lastEventSource().onerror as any)();
      });

      expect(result.current.snackbar?.message).toContain('Falha na conexão');
      expect(result.current.running).toBe(false);
    });

    it('busca_manual_500_mostra_snackbar_de_erro_generico', async () => {
      // Sem `error` no body: usa o fallback genérico.
      setRoute('POST', '/api/pipeline', 500, {});
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      expect(result.current.snackbar?.message).toContain('Erro ao iniciar a busca de vagas');
      expect(result.current.running).toBe(false);
      expect(result.current.autoSyncing).toBe(false);
    });

    it('busca_manual_429_sem_retryAfter_mostra_erro_sem_cooldown', async () => {
      setRoute('POST', '/api/pipeline', 429, { error: 'rate limit' });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      expect(result.current.cooldown).toBe(0);
      expect(result.current.snackbar?.message).toContain('rate limit');
      expect(storageMock.setCooldownEnd).not.toHaveBeenCalled();
    });

    it('fetch_throw_mostra_snackbar_de_erro_generico', async () => {
      setRouteThrow('POST', '/api/pipeline');
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      expect(result.current.snackbar?.message).toContain('Erro ao iniciar a busca de vagas');
      expect(result.current.running).toBe(false);
    });

    it('watchdog_encerra_o_stream_apos_180s', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(180_000);
      });

      expect(result.current.running).toBe(false);
      expect(result.current.snackbar?.message).toContain('demorou mais que o esperado');
      expect(lastEventSource().closed).toBe(true);
    });

    it('auto_sync_sucesso_nao_mostra_snackbar', async () => {
      setRoute('POST', '/api/pipeline', 200, { runId: 'auto', cooldownSeconds: 0 });
      const { result } = renderHook(() => useJobSearch());

      await act(async () => {
        await result.current.handleStart({ silent: true });
      });

      expect(result.current.autoSyncing).toBe(true);
      expect(result.current.cooldown).toBe(0);
      expect(storageMock.setCooldownEnd).not.toHaveBeenCalled();

      await act(async () => {
        await (lastEventSource().onmessage as any)({
          data: JSON.stringify({ type: 'pipeline_complete', jobs: [JOB_DEV] }),
        });
      });

      expect(result.current.snackbar).toBeNull();
      expect(result.current.jobs).toEqual([{ ...JOB_DEV, detectedAt: '' }]);
      expect(result.current.autoSyncing).toBe(false);
    });
  });

  describe('addSuggestion e auto-sync', () => {
    it('addSuggestion_adiciona_e_nao_duplica', async () => {
      // Última busca recente: evita o effect de auto-sync disparar ao adicionar sugestões.
      storageMock.getLastRunAt.mockResolvedValue(Date.now());
      const { result } = renderHook(() => useJobSearch());
      await flushMount();

      act(() => result.current.addSuggestion('dev'));
      act(() => result.current.addSuggestion('dev'));
      act(() => result.current.addSuggestion('ops'));

      expect(result.current.roleQueries).toEqual(['dev', 'ops']);
    });

    it('auto_sync_dispara_quando_ultima_busca_antiga_e_ha_filtros', async () => {
      storageMock.getFilters.mockResolvedValue({ companies: ['Acme'], roles: [] });
      storageMock.getLastRunAt.mockResolvedValue(Date.now() - 16 * 60 * 1000);
      setRoute('POST', '/api/pipeline', 429, { error: 'auto cheio', retryAfter: 300 });

      const { result } = renderHook(() => useJobSearch());
      // Espera filtros + cooldown carregarem e o effect de auto-sync decidir
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          await Promise.resolve();
        });
      }

      expect(result.current.companies).toEqual(['Acme']);
      const pipelineCall = fetchMock.mock.calls.find(
        (c) => String(c[0]) === '/api/pipeline',
      );
      expect(pipelineCall).toBeTruthy();
      expect(JSON.parse(pipelineCall![1].body)).toMatchObject({ auto: true });
      // 429 silencioso: marca lastRunAt para não re-disparar em loop, sem snackbar.
      expect(storageMock.setLastRunAt).toHaveBeenCalled();
      expect(result.current.snackbar).toBeNull();
      expect(FakeEventSource.instances).toHaveLength(0);
    });

    it('auto_sync_nao_dispara_sem_filtros_salvos', async () => {
      renderHook(() => useJobSearch());
      await flushMount();

      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
