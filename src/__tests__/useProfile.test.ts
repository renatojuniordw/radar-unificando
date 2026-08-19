// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useProfile } from '@/hooks/useProfile';

const fetchMock = vi.fn();
(globalThis as any).fetch = fetchMock;

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as any;
}
function fail(status = 500, body = { error: 'erro' }) {
  return { ok: false, status, json: async () => body } as any;
}

const PROFILE_DATA = {
  skills: ['python', 'sql'],
  seniority: 'senior',
  experienceYears: 6,
  currentRole: 'Engenheiro de Dados',
  area: 'dados',
  education: ['Graduação'],
  resumeText: 'Resumo profissional com mais de cinquenta caracteres de texto.',
  resumeMarkdown: null,
};

type RouteHandler = (url: string, init?: any) => Promise<any>;
let routes: Record<string, RouteHandler> = {};

function setupRoutes(handlers: Record<string, RouteHandler>) {
  routes = handlers;
  fetchMock.mockImplementation(async (input: any, init?: any) => {
    const url: string = typeof input === 'string' ? input : String(input.url);
    const method = (init?.method ?? 'GET').toUpperCase();
    const handler = routes[`${method} ${url}`];
    if (handler) return handler(url, init);
    return fail(404);
  });
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

function mockEmptyProfile() {
  routes['GET /api/profile'] = () => ok({ skills: [], resumeText: '', resumeMarkdown: null });
}

describe('useProfile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setupRoutes({
      'GET /api/profile': () => ok(PROFILE_DATA),
      'PUT /api/profile': () => ok({ ok: true }),
      'POST /api/upload': () => ok({ jobId: 'job-1' }),
      'GET /api/upload/job-1': () =>
        ok({ status: 'completed', result: { skills: ['python', 'sql', 'dbt'], experience: 6, seniority: 'senior', currentRole: 'Engenheiro de Dados', area: 'dados', education: ['Graduação'], markdown: '# CV', resumeText: 'novo texto', count: 3 } }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carrega_o_perfil_do_servidor_no_mount', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.skills).toEqual(['python', 'sql']);
    expect(result.current.currentRole).toBe('Engenheiro de Dados');
    expect(result.current.profileSource).toBe('linkedin'); // tem resumeText
  });

  it('deriva_profileSource_manual_quando_nao_ha_resume', async () => {
    routes['GET /api/profile'] = () => ok({ ...PROFILE_DATA, resumeText: '', resumeMarkdown: null });
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.profileSource).toBe('manual');
  });

  it('trata_401_como_sessao_expirada', async () => {
    routes['GET /api/profile'] = () => fail(401);
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.loadError).toContain('Sessão expirada');
    expect(result.current.loading).toBe(false);
  });

  it('trata_erro_nao_401', async () => {
    routes['GET /api/profile'] = () => fail(500);
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.loadError).toContain('Erro ao carregar perfil');
  });

  it('trata_erro_de_rede', async () => {
    routes['GET /api/profile'] = () => Promise.reject(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.loadError).toContain('Erro de conexão');
  });

  it('addSkill_normaliza_e_nao_duplica', async () => {
    mockEmptyProfile();
    const { result } = renderHook(() => useProfile());
    await flush();

    act(() => result.current.addSkill('  Python  '));
    act(() => result.current.addSkill('python'));
    act(() => result.current.addSkill('SQL'));

    expect(result.current.skills).toEqual(['python', 'sql']);
    expect(result.current.fieldOverrides.has('skills')).toBe(true);
  });

  it('addSkills_adiciona_varios_de_uma_vez', async () => {
    mockEmptyProfile();
    const { result } = renderHook(() => useProfile());
    await flush();

    act(() => result.current.addSkills(['  React ', 'DevOps ']));

    expect(result.current.skills).toEqual(['react', 'devops']);
  });

  it('removeSkill_remove_da_lista', async () => {
    mockEmptyProfile();
    const { result } = renderHook(() => useProfile());
    await flush();
    act(() => result.current.addSkill('python'));

    act(() => result.current.removeSkill('python'));

    expect(result.current.skills).toEqual([]);
  });

  it('setField_marca_override_e_revertField_desmarca', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    act(() => result.current.setField('seniority', 'pleno'));

    expect(result.current.seniority).toBe('pleno');
    expect(result.current.fieldOverrides.has('seniority')).toBe(true);

    act(() => result.current.revertField('seniority'));

    expect(result.current.fieldOverrides.has('seniority')).toBe(false);
  });

  it('revertAll_limpa_todos_os_overrides', async () => {
    mockEmptyProfile();
    const { result } = renderHook(() => useProfile());
    await flush();
    act(() => result.current.setField('area', 'frontend'));
    act(() => result.current.addSkill('css'));

    act(() => result.current.revertAll());

    expect(result.current.fieldOverrides.size).toBe(0);
  });

  it('setManualMode_define_manual_e_limpa_overrides', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();
    act(() => result.current.setField('area', 'frontend'));

    act(() => result.current.setManualMode());

    expect(result.current.profileSource).toBe('manual');
    expect(result.current.fieldOverrides.size).toBe(0);
  });

  it('expõe_dragOver_e_setDragOver_para_a_zona_de_drop', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    expect(result.current.dragOver).toBe(false);
    act(() => result.current.setDragOver(true));
    expect(result.current.dragOver).toBe(true);
  });

  it('handleSave_retorna_sucesso_e_chama_put', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    const res = await act(async () => result.current.handleSave());

    expect(res).toEqual({ success: true });
    const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(putCall).toBeTruthy();
    const body = JSON.parse(putCall![1].body);
    expect(body.skills).toEqual(['python', 'sql']);
    expect(body.profileSource).toBe('linkedin');
  });

  it('handleSave_trata_falha_do_servidor', async () => {
    routes['PUT /api/profile'] = () => fail(500);
    const { result } = renderHook(() => useProfile());
    await flush();

    const res = await act(async () => result.current.handleSave());

    expect(res).toEqual({ success: false, error: 'Erro ao salvar' });
  });

  it('handleSave_trata_erro_de_rede', async () => {
    routes['PUT /api/profile'] = () => Promise.reject(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useProfile());
    await flush();

    const res = await act(async () => result.current.handleSave());

    expect(res).toEqual({ success: false, error: 'Erro ao salvar' });
  });

  it('calcula_completionScore_e_percentual', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    // skills(2) < 3 → false; seniority, experienceYears, currentRole, area, resumeText>50 → true = 5/6
    expect(result.current.completionScore).toBe(5);
    expect(result.current.completionPercent).toBe(83);
  });

  it('recusa_texto_curto_na_extracao', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();
    fetchMock.mockClear();

    const res = await act(async () => result.current.extractFromResume('curto'));

    expect(res).toEqual({ success: false, error: 'Cole o currículo primeiro (mínimo 20 caracteres)' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('extrai_skills_de_texto_com_sucesso', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(2100);
      res = await promise;
    });

    expect(res!.success).toBe(true);
    expect(res!.message).toContain('3 skills');
    expect(result.current.skills).toContain('dbt');
    expect(result.current.profileSource).toBe('linkedin');
    expect(result.current.extracting).toBe(false);
  });

  it('extrai_skills_de_arquivo_file_com_sucesso', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();
    const file = new File(['conteudo'], 'cv.pdf', { type: 'application/pdf' });

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume(file);
      await vi.advanceTimersByTimeAsync(2100);
      res = await promise;
    });

    expect(res!.success).toBe(true);
    expect(res!.message).toContain('Currículo processado');
    const postCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'POST');
    expect(postCall![1].body instanceof FormData).toBe(true);
  });

  it('respeita_overrides_manuais_ao_extrair', async () => {
    const { result } = renderHook(() => useProfile());
    await flush();
    act(() => result.current.setField('seniority', 'pleno'));

    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(2100);
      await promise;
    });

    expect(result.current.seniority).toBe('pleno'); // override mantido
    expect(result.current.skills).toContain('dbt'); // sem override, atualiza
  });

  it('propaga_erro_quando_o_job_falha', async () => {
    routes['GET /api/upload/job-1'] = () => ok({ status: 'failed', error: 'LLM fora do ar' });
    const { result } = renderHook(() => useProfile());
    await flush();

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(2100);
      res = await promise;
    });

    expect(res!.success).toBe(false);
    expect(res!.error).toBe('LLM fora do ar');
  });

  it('propaga_erro_quando_a_api_de_status_falha', async () => {
    routes['GET /api/upload/job-1'] = () => fail(500, { error: 'Erro ao consultar o processamento' });
    const { result } = renderHook(() => useProfile());
    await flush();

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(2100);
      res = await promise;
    });

    expect(res!.success).toBe(false);
    expect(res!.error).toBe('Erro ao consultar o processamento');
  });

  it('continua_polling_apos_erro_de_rede_transitorio', async () => {
    let calls = 0;
    routes['GET /api/upload/job-1'] = () => {
      calls += 1;
      if (calls === 1) return Promise.reject(new TypeError('Failed to fetch'));
      return ok({ status: 'completed', result: { skills: ['python'], experience: 6, seniority: null, currentRole: null, area: null, education: [], markdown: null, resumeText: 'novo', count: 1 } });
    };
    const { result } = renderHook(() => useProfile());
    await flush();

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(4200);
      res = await promise;
    });

    expect(calls).toBe(2);
    expect(res!.success).toBe(true);
  });

  it('retorna_timeout_apos_muitas_tentativas', async () => {
    routes['GET /api/upload/job-1'] = () => Promise.reject(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useProfile());
    await flush();

    let res: any;
    await act(async () => {
      const promise = result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.');
      await vi.advanceTimersByTimeAsync(151_000); // 75 tentativas × 2s
      res = await promise;
    });

    expect(res!.success).toBe(false);
    expect(res!.error).toContain('demorou mais que o esperado');
  });

  it('trata_abort_do_upload_como_timeout', async () => {
    routes['POST /api/upload'] = () => Promise.reject(new DOMException('aborted', 'AbortError'));
    const { result } = renderHook(() => useProfile());
    await flush();

    const res = await act(async () => result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.'));

    expect(res!.success).toBe(false);
    expect(res!.error).toContain('demorou demais');
  });

  it('trata_erro_generico_na_extracao', async () => {
    routes['POST /api/upload'] = () => fail(400, { error: 'Formato inválido' });
    const { result } = renderHook(() => useProfile());
    await flush();

    const res = await act(async () => result.current.extractFromResume('Currículo com mais de vinte caracteres para extração.'));

    expect(res!.success).toBe(false);
    expect(res!.error).toBe('Formato inválido');
  });
});
